import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    example: 'retailer@example.com',
    description: 'Email address of the account to resend verification for',
  })
  @IsEmail()
  email: string;
}
