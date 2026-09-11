import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RegisterDto, UserRole } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { fullName, email, password, phone, role } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          full_name: fullName,
          email,
          password_hash: hashedPassword,
          phone,
          role,
        },
      });
      if (role === UserRole.RETAILER) {
        await tx.customer.create({
          data: {
            user_id: user.id,
            business_name: fullName,
            business_location: '',
            contact_person: fullName,
            phone: phone ?? '',
          },
        });
      }
      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenHash = createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.verificationToken.create({
        data: {
          token_hash: verificationTokenHash,
          expires_at: verificationExpiresAt,
          user_id: user.id,
        },
      });
      return {
        message: 'User registered successfully',

        // TEMPORARY: only for Postman testing
        verificationToken,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
      };
    });
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.is_verified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      message: 'Login Successful',
      accessToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    };
  }
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return the same response.
    // This prevents attackers from discovering registered emails.
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been generated.',
      };
    }

    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Invalidate previous unused reset tokens
    await this.prisma.passwordResetToken.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        token_hash: tokenHash,
        expires_at: expiresAt,
        user_id: user.id,
      },
    });

    return {
      message:
        'If an account with that email exists, a password reset link has been generated.',

      // TEMPORARY for Postman testing.
      // Remove when email delivery is implemented.
      resetToken: token,
    };
  }
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token_hash: tokenHash,
      },
      include: {
        user: true,
      },
    });
    if (
      !resetToken ||
      resetToken.used_at ||
      resetToken.expires_at < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: resetToken.user_id,
        },
        data: {
          password_hash: passwordHash,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          used_at: new Date(),
        },
      }),
    ]);
    return {
      message: 'Password reset successfully',
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });

    if (
      !verificationToken ||
      verificationToken.used_at ||
      verificationToken.expires_at < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: verificationToken.user_id,
        },
        data: {
          is_verified: true,
        },
      }),

      this.prisma.verificationToken.update({
        where: {
          id: verificationToken.id,
        },
        data: {
          used_at: new Date(),
        },
      }),
    ]);

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Do not reveal whether an account exists.
    if (!user) {
      return {
        message:
          'If an unverified account with that email exists, a verification link has been generated.',
      };
    }

    if (user.is_verified) {
      return {
        message: 'Email is already verified',
      };
    }

    const verificationToken = randomBytes(32).toString('hex');

    const verificationTokenHash = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Invalidate previous unused verification tokens.
    await this.prisma.verificationToken.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    await this.prisma.verificationToken.create({
      data: {
        token_hash: verificationTokenHash,
        expires_at: verificationExpiresAt,
        user_id: user.id,
      },
    });

    return {
      message:
        'If an unverified account with that email exists, a verification link has been generated.',

      // TEMPORARY for Swagger/Postman testing.
      // Remove when email delivery is implemented.
      verificationToken,
    };
  }
}
