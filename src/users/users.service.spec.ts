import {
    BadRequestException,
    NotFoundException,
  } from '@nestjs/common';
  import { Test, TestingModule } from '@nestjs/testing';
  import { UsersService } from './users.service';
  import { PrismaService } from '../prisma/prisma.service';
  
  describe('UsersService', () => {
    let service: UsersService;
    let prisma: any;
  
    beforeEach(async () => {
      prisma = {
        user: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
        auditLog: {
          create: jest.fn(),
        },
        $transaction: jest.fn(),
      };
  
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
        ],
      }).compile();
  
      service = module.get<UsersService>(UsersService);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe('findAll', () => {
      it('should return all users', async () => {
        const users = [
          {
            id: 'user-1',
            full_name: 'John Doe',
            email: 'john@example.com',
            role: 'RETAILER',
            status: 'ACTIVE',
          },
        ];
  
        prisma.user.findMany.mockResolvedValue(users);
  
        const result = await service.findAll();
  
        expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
        expect(result).toEqual(users);
      });
  
      it('should filter users by role and status', async () => {
        prisma.user.findMany.mockResolvedValue([]);
  
        await service.findAll(undefined, 'ADMIN', 'ACTIVE');
  
        expect(prisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              role: 'ADMIN',
              status: 'ACTIVE',
            },
          }),
        );
      });
  
      it('should search users by name or email', async () => {
        prisma.user.findMany.mockResolvedValue([]);
  
        await service.findAll('john');
  
        expect(prisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                {
                  full_name: {
                    contains: 'john',
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: 'john',
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }),
        );
      });
    });
  
    describe('updateStatus', () => {
      const targetUser = {
        id: 'user-1',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        role: 'RETAILER',
        status: 'ACTIVE',
        created_at: new Date(),
      };
  
      const updatedUser = {
        ...targetUser,
        status: 'INACTIVE',
      };
  
      it('should update user status and create an audit log', async () => {
        prisma.user.findUnique.mockResolvedValue(targetUser);
  
        prisma.$transaction.mockImplementation(async (callback) => {
          const tx = {
            user: {
              update: jest.fn().mockResolvedValue(updatedUser),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({
                audit_log_id: 1,
              }),
            },
          };
  
          return callback(tx);
        });
  
        const result = await service.updateStatus(
          'user-1',
          'INACTIVE',
          'admin-1',
        );
  
        expect(result).toEqual(updatedUser);
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      });
  
      it('should create the correct audit information', async () => {
        prisma.user.findUnique.mockResolvedValue(targetUser);
  
        const tx = {
          user: {
            update: jest.fn().mockResolvedValue(updatedUser),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({
              audit_log_id: 1,
            }),
          },
        };
  
        prisma.$transaction.mockImplementation(async (callback) =>
          callback(tx),
        );
  
        await service.updateStatus(
          'user-1',
          'INACTIVE',
          'admin-1',
        );
  
        expect(tx.auditLog.create).toHaveBeenCalledWith({
          data: {
            actor_id: 'admin-1',
            action: 'USER_STATUS_UPDATED',
            resource: 'USER',
            target_id: 'user-1',
            metadata: {
              previousStatus: 'ACTIVE',
              newStatus: 'INACTIVE',
            },
          },
        });
      });
  
      it('should throw NotFoundException when user does not exist', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
  
        await expect(
          service.updateStatus(
            'missing-user',
            'INACTIVE',
            'admin-1',
          ),
        ).rejects.toBeInstanceOf(NotFoundException);
  
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });
  
      it('should prevent the only active admin from deactivating themselves', async () => {
        const admin = {
          ...targetUser,
          id: 'admin-1',
          role: 'ADMIN',
          status: 'ACTIVE',
        };
  
        prisma.user.findUnique.mockResolvedValue(admin);
        prisma.user.count.mockResolvedValue(1);
  
        await expect(
          service.updateStatus(
            'admin-1',
            'INACTIVE',
            'admin-1',
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
  
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });
  
      it('should allow an admin to deactivate themselves when another active admin exists', async () => {
        const admin = {
          ...targetUser,
          id: 'admin-1',
          role: 'ADMIN',
          status: 'ACTIVE',
        };
  
        const deactivatedAdmin = {
          ...admin,
          status: 'INACTIVE',
        };
  
        prisma.user.findUnique.mockResolvedValue(admin);
        prisma.user.count.mockResolvedValue(2);
  
        prisma.$transaction.mockImplementation(async (callback) => {
          const tx = {
            user: {
              update: jest.fn().mockResolvedValue(deactivatedAdmin),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({
                audit_log_id: 1,
              }),
            },
          };
  
          return callback(tx);
        });
  
        const result = await service.updateStatus(
          'admin-1',
          'INACTIVE',
          'admin-1',
        );
  
        expect(result.status).toBe('INACTIVE');
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      });
    });
  });