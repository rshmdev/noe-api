// src/webhooks/webhooks.controller.ts
import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { stripe } from '../config/stripe.config';
import { PaymentsService } from '../payments/payments.service';
import Stripe from 'stripe';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      // Lê o body cru para verificar a assinatura
      const rawBody =
        req.body instanceof Buffer ? req.body.toString() : req.rawBody;

      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error('Erro ao validar assinatura do Stripe:', err.message);
      throw new BadRequestException(`Erro no webhook: ${err.message}`);
    }

    // Lida com a confirmação do pagamento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Confirma o pagamento no banco

      const paymentIntentId = session.id as string;
      if (paymentIntentId) {
        await this.paymentsService.markAsPaid(paymentIntentId);
      }
    }

    return { received: true };
  }
}
