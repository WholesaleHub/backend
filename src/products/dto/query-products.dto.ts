import { Type } from 'class-transformer'
import {
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator'

export class QueryProductDto {
    @IsOptional()
    @IsString()
    search?: string

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
}