import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the product being ordered',
  })
  @IsInt()
  product_id: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity of the product being ordered',
  })
  @IsInt()
  @IsPositive()
  quantity: number;
}
