import { IsInt, IsPositive } from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  product_id: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
