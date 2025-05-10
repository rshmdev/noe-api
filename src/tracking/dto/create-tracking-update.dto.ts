import { IsEnum, IsLatitude, IsLongitude } from 'class-validator';

export class CreateTrackingUpdateDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  @IsEnum(['waiting_pickup', 'in_transit', 'delivered'])
  status: 'waiting_pickup' | 'in_transit' | 'delivered';
}
