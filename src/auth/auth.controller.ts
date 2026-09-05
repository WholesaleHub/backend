import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req){
        return req.user;
    }
    @Roles('ADMIN')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('admin')
    getAdminData() {
        return {
        message: 'Welcome Admin!',
  };
}

    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(
            dto.token,
            dto.newPassword,
        );
    }
    @Post('verify-email')
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }
}
