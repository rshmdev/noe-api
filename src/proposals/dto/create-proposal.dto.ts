import { IsUUID, IsNumber, IsString, Min } from 'class-validator';

export class CreateProposalDto {
  @IsUUID()
  routeId: string;

  @IsUUID()
  userId: string; // usuário que vai receber a proposta

  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  chatId: string; // ← NOVO

  @IsString()
  message: string;
}
