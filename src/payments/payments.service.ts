import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal } from '../proposals/entities/proposal.entity';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { stripe } from '../config/stripe.config';
import { User } from '../users/entities/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Proposal)
    private proposalRepo: Repository<Proposal>,
  ) {}

  generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  // src/payments/payments.service.ts
  async create(dto: CreatePaymentDto, user: User) {
    // Validação da proposta
    const proposal = await this.proposalRepo.findOne({
      where: { id: dto.proposalId },
      relations: ['user', 'transportador'],
    });

    if (!proposal || proposal.user.id !== user.id) {
      throw new UnauthorizedException('Você não pode pagar esta proposta');
    }

    if (proposal.status !== 'accepted') {
      throw new BadRequestException('Proposta ainda não foi aceita');
    }

    // Verifica se já existe um pagamento para essa proposta
    const existingPayment = await this.paymentRepo.findOne({
      where: { proposal },
    });

    if (existingPayment) return existingPayment;

    // Cria a sessão do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Transporte de ${proposal.user.name}`,
              description: `De ${proposal.transportador.name} para ${proposal.user.name}`,
            },
            unit_amount: Math.round(Number(proposal.price) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        proposalId: proposal.id,
        userId: user.id,
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pagamento-canceled`,
    });

    // Cria o registro do pagamento no banco
    const payment = this.paymentRepo.create({
      proposal,
      stripePaymentIntentId: session.id as string,
      status: 'pending',
      pickupCode: this.generateCode(),
      deliveryCode: this.generateCode(),
    });

    // Salva o pagamento no banco
    await this.paymentRepo.save(payment);

    // Retorna o ID da sessão do Stripe para o frontend
    return { sessionId: session.id };
  }

  async markAsPaid(paymentIntentId: string) {
    console.log('Marcando como pago:', paymentIntentId);

    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) return;

    payment.status = 'paid';
    await this.paymentRepo.save(payment);
  }

  async listByUser(user: User) {
    return this.paymentRepo.find({
      where: [
        { proposal: { user: { id: user.id } } },
        { proposal: { transportador: { id: user.id } } },
      ],
      relations: [
        'proposal',
        'proposal.user',
        'proposal.transportador',
        'proposal.route',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string, user: User) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: [
        'proposal',
        'proposal.user',
        'proposal.transportador',
        'proposal.route',
      ],
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (
      payment.proposal.user.id !== user.id &&
      payment.proposal.transportador.id !== user.id
    ) {
      throw new UnauthorizedException('Acesso negado');
    }

    return payment;
  }

  async getByProposal(proposalId: string, user: User) {
    const proposal = await this.proposalRepo.findOne({
      where: { id: proposalId },
      relations: ['user', 'transportador'],
    });

    if (
      !proposal ||
      (proposal.user.id !== user.id && proposal.transportador.id !== user.id)
    ) {
      throw new UnauthorizedException('Acesso negado');
    }

    return this.paymentRepo.findOne({
      where: { proposal },
    });
  }

  async confirmDelivery(paymentId: string, deliveryCode: string, user: User) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['proposal', 'proposal.user'],
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (payment.proposal.user.id !== user.id) {
      throw new UnauthorizedException('Você não pode confirmar essa entrega');
    }

    if (payment.deliveryCode !== deliveryCode.toUpperCase()) {
      throw new BadRequestException('Código de entrega inválido');
    }

    // Atualiza o status para "confirmed"
    payment.status = 'confirmed';
    payment.confirmedAt = new Date();

    return this.paymentRepo.save(payment);
  }
}
