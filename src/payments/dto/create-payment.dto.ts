import { IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  proposalId: string;
}
