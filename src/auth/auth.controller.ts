import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user profile returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getProfile(@Req() req) {
    return req.user;
  }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Access admin-only data' })
  @ApiResponse({
    status: 200,
    description: 'Admin data returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  getAdminData() {
    return {
      message: 'Welcome Admin!',
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Password reset request processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @ApiOperation({ summary: 'Verify a user email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 201,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification token' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: 201,
    description: 'Verification request processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }
}
