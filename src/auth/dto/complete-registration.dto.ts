import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompleteRegistrationDto {
  @ApiPropertyOptional({ example: 'Caminhonete 4x4' })
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'ABC-1234' })
  @IsString()
  vehiclePlate?: string;
}
