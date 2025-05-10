import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  create(@Body() dto: CreatePaymentDto, @Req() req) {
    return this.paymentsService.create(dto, req.user);
  }

  @Get('proposal/:proposalId')
  getByProposal(@Param('proposalId') proposalId: string, @Req() req) {
    return this.paymentsService.getByProposal(proposalId, req.user);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body('code') code: string, @Req() req) {
    return this.paymentsService.confirmDelivery(id, code, req.user);
  }

  @Get()
  listMyPayments(@Req() req) {
    return this.paymentsService.listByUser(req.user);
  }

  @Get(':id')
  getPayment(@Param('id') id: string, @Req() req) {
    return this.paymentsService.getById(id, req.user);
  }
}
