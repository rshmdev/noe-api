import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreateReviewDto, user: User) {
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentId },
      relations: ['proposal', 'proposal.user', 'proposal.transportador'],
    });

    if (!payment || payment.status !== 'confirmed') {
      throw new BadRequestException(
        'Pagamento inválido ou entrega não confirmada',
      );
    }

    // Verifica se já avaliou
    const existing = await this.reviewRepo.findOne({
      where: {
        payment: { id: dto.paymentId },
        authorUser: { id: user.id },
      },
    });

    if (existing) {
      throw new BadRequestException('Você já avaliou essa entrega');
    }

    // Só pode avaliar se participou da entrega
    const isRelated =
      payment.proposal.user.id === user.id ||
      payment.proposal.transportador.id === user.id;

    if (!isRelated) {
      throw new UnauthorizedException('Você não participou dessa entrega');
    }

    const target =
      payment.proposal.user.id === user.id
        ? payment.proposal.transportador
        : payment.proposal.user;

    const review = this.reviewRepo.create({
      authorUser: user,
      targetUser: target,
      payment,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.reviewRepo.save(review);
  }

  async listByUser(targetUserId: string) {
    return this.reviewRepo.find({
      where: { targetUser: { id: targetUserId } },
      relations: ['authorUser'],
      order: { createdAt: 'DESC' },
    });
  }
}
