import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StopDto {
  @ApiProperty({ example: 'Belo Horizonte - MG' })
  @IsString()
  location: string;

  @ApiProperty({ example: '2025-04-25T08:00:00Z' })
  @IsDateString()
  arrivalTime: string;

  @ApiProperty({ example: '2025-04-25T10:00:00Z' })
  @IsDateString()
  departureTime: string;

  @ApiPropertyOptional({ example: 'Parada para alimentação dos animais' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRouteDto {
  @ApiProperty({ example: 'São Paulo - SP' })
  @IsString()
  origin: string;

  @ApiProperty({ example: '2025-04-25T05:00:00Z' })
  @IsDateString()
  originDate: string;

  @ApiProperty({ example: 'Rio de Janeiro - RJ' })
  @IsString()
  destination: string;

  @ApiProperty({ example: '2025-04-25T18:00:00Z' })
  @IsDateString()
  destinationDate: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  availableSlots: number;

  @ApiProperty({
    example: ['Cães', 'Gatos'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  speciesAccepted: string[];

  @ApiProperty({
    example: ['Pequeno', 'Médio'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  animalSizeAccepted: string[];

  @ApiProperty({
    example: 'Veículo com ar-condicionado e monitoramento por câmera',
  })
  @IsString()
  vehicleObservations: string;

  @ApiPropertyOptional({ example: 'R$ 100 por animal até 10kg' })
  @IsOptional()
  @IsString()
  priceDescription?: string;

  @ApiProperty({
    type: [StopDto],
    description: 'Paradas intermediárias no trajeto',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopDto)
  stops: StopDto[];
}
