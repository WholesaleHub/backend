import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  product_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsInt()
  @IsNotEmpty()
  category_id: number;

  @IsNumber()
  @IsNotEmpty()
  unit_price: number;

  @IsInt()
  @IsNotEmpty()
  stock_quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  status?: string;  
}