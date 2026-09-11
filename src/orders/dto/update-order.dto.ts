import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
