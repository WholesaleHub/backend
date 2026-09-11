import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'retailer@example.com',
    description: 'Email address associated with the user account',
  })
  @IsEmail()
  email: string;
}
