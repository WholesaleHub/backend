import {
    IsArray,
    IsInt,
    ValidateNested,
    ArrayMinSize,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { CreateOrderItemDto } from './create-order-item.dto';
  
  export class CreateOrderDto {
    @IsInt()
    customer_id: number;
  
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
  }