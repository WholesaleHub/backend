import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  
    customer: {
      create: jest.fn(),
    },
  
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  
    verificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject login when email is not verified', async () => {
    const user = {
      id: 'user-1',
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '0712345678',
      password_hash: 'hashed-password',
      role: 'RETAILER',
      status: 'ACTIVE',
      is_verified: false,
    };
  
    mockPrismaService.user.findUnique.mockResolvedValue(user);
  
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  
    await expect(
      service.login({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(
      'Please verify your email before logging in',
    );
  
    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });

  it('should allow login when email is verified', async () => {
    const user = {
      id: 'user-1',
      full_name: 'Verified User',
      email: 'verified@example.com',
      phone: '0712345678',
      password_hash: 'hashed-password',
      role: 'RETAILER',
      status: 'ACTIVE',
      is_verified: true,
    };
  
    mockPrismaService.user.findUnique.mockResolvedValue(user);
  
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  
    mockJwtService.signAsync.mockResolvedValue('test-access-token');
  
    const result = await service.login({
      email: 'verified@example.com',
      password: 'Password123!',
    });
  
    expect(result).toEqual({
      message: 'Login Successful',
      accessToken: 'test-access-token',
      user: {
        id: 'user-1',
        fullName: 'Verified User',
        email: 'verified@example.com',
        phone: '0712345678',
        role: 'RETAILER',
        status: 'ACTIVE',
      },
    });
  
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'verified@example.com',
      role: 'RETAILER',
    });
  });

  it('should verify email with a valid verification token', async () => {
    const verificationToken = {
      id: 1,
      token_hash: 'hashed-token',
      user_id: 'user-1',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used_at: null,
    };
  
    mockPrismaService.verificationToken.findUnique.mockResolvedValue(
      verificationToken,
    );
  
    mockPrismaService.$transaction.mockResolvedValue([
      { is_verified: true },
      { ...verificationToken, used_at: new Date() },
    ]);
  
    const result = await service.verifyEmail('valid-token');
  
    expect(result).toEqual({
      message: 'Email verified successfully',
    });
  
    expect(
      mockPrismaService.verificationToken.findUnique,
    ).toHaveBeenCalled();
  
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        is_verified: true,
      },
    });
  
    expect(
      mockPrismaService.verificationToken.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        used_at: expect.any(Date),
      },
    });
  
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
  });

  it('should reject an expired verification token', async () => {
    const expiredToken = {
      id: 2,
      token_hash: 'expired-token-hash',
      user_id: 'user-1',
      expires_at: new Date(Date.now() - 60 * 60 * 1000),
      used_at: null,
    };
  
    mockPrismaService.verificationToken.findUnique.mockResolvedValue(
      expiredToken,
    );
  
    await expect(
      service.verifyEmail('expired-token'),
    ).rejects.toThrow(
      'Invalid or expired verification token',
    );
  
    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  
    expect(
      mockPrismaService.verificationToken.update,
    ).not.toHaveBeenCalled();
  
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('should reject an already used verification token', async () => {
    const usedToken = {
      id: 3,
      token_hash: 'used-token-hash',
      user_id: 'user-1',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used_at: new Date(),
    };
  
    mockPrismaService.verificationToken.findUnique.mockResolvedValue(
      usedToken,
    );
  
    await expect(
      service.verifyEmail('used-token'),
    ).rejects.toThrow(
      'Invalid or expired verification token',
    );
  
    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  
    expect(
      mockPrismaService.verificationToken.update,
    ).not.toHaveBeenCalled();
  
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('should create a password reset token for an existing user', async () => {
    const user = {
      id: 'user-1',
      full_name: 'Test User',
      email: 'test@example.com',
      password_hash: 'hashed-password',
    };
  
    mockPrismaService.user.findUnique.mockResolvedValue(user);
  
    mockPrismaService.passwordResetToken.updateMany.mockResolvedValue({
      count: 1,
    });
  
    mockPrismaService.passwordResetToken.create.mockResolvedValue({
      id: 1,
    });
  
    const result = await service.requestPasswordReset(
      'test@example.com',
    );
  
    expect(result.message).toBe(
      'If an account with that email exists, a password reset link has been generated.',
    );
  
    // Temporary token should currently be returned for Postman testing.
    expect(result.resetToken).toEqual(expect.any(String));
    expect(result.resetToken).toHaveLength(64);
  
    // Previous unused tokens should be invalidated.
    expect(
      mockPrismaService.passwordResetToken.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
        used_at: null,
      },
      data: {
        used_at: expect.any(Date),
      },
    });
  
    // A new hashed reset token should be stored.
    expect(
      mockPrismaService.passwordResetToken.create,
    ).toHaveBeenCalledWith({
      data: {
        token_hash: expect.any(String),
        expires_at: expect.any(Date),
        user_id: 'user-1',
      },
    });
  });

  it('should return the same response when password reset email does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
  
    const result = await service.requestPasswordReset(
      'unknown@example.com',
    );
  
    expect(result).toEqual({
      message:
        'If an account with that email exists, a password reset link has been generated.',
    });
  
    expect(
      mockPrismaService.passwordResetToken.updateMany,
    ).not.toHaveBeenCalled();
  
    expect(
      mockPrismaService.passwordResetToken.create,
    ).not.toHaveBeenCalled();
  });

  it('should reset password with a valid reset token', async () => {
    const resetToken = {
      id: 1,
      token_hash: 'hashed-token',
      expires_at: new Date(Date.now() + 30 * 60 * 1000),
      used_at: null,
      user_id: 'user-1',
      user: {
        id: 'user-1',
        email: 'test@example.com',
      },
    };
  
    mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
      resetToken,
    );
  
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
  
    mockPrismaService.user.update.mockReturnValue({
      id: 'user-1',
    });
  
    mockPrismaService.passwordResetToken.update.mockReturnValue({
      id: 1,
    });
  
    mockPrismaService.$transaction.mockResolvedValue([
      { id: 'user-1' },
      { id: 1 },
    ]);
  
    const result = await service.resetPassword(
      'valid-reset-token',
      'NewPassword123!',
    );
  
    expect(result).toEqual({
      message: 'Password reset successfully',
    });
  
    expect(bcrypt.hash).toHaveBeenCalledWith(
      'NewPassword123!',
      10,
    );
  
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        password_hash: 'new-hashed-password',
      },
    });
  
    expect(
      mockPrismaService.passwordResetToken.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        used_at: expect.any(Date),
      },
    });
  
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
  });
});
