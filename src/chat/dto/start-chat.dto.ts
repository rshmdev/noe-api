import { IsUUID } from 'class-validator';

export class StartChatDto {
  @IsUUID()
  userId: string; // outro participante

  @IsUUID()
  routeId: string;
}
