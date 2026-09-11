import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export enum UserRole {
  RETAILER = 'RETAILER',
  WHOLESALER = 'WHOLESALER',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'retailer@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: '+254712345678',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.RETAILER,
    description: 'Role assigned to the user',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
