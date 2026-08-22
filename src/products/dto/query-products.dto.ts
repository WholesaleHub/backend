import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class QueryProductDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category?: number;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
