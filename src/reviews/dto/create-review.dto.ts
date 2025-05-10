import { IsUUID, IsInt, Min, Max, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  paymentId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}
