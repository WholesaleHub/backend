import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  product_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  category_id: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  unit_price: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  stock_quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  status?: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}