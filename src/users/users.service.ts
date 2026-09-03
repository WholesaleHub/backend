import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, role?: string, status?: string) {
    return this.prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(status && { status }),
        ...(search && {
          OR: [
            {
              full_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
  
  async updateStatus(
    targetUserId: string,
    status: string,
    currentUserId: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
    });
  
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
  
    if (
      targetUser.id === currentUserId &&
      targetUser.role === 'ADMIN' &&
      status !== 'ACTIVE'
    ) {
      const activeAdmins = await this.prisma.user.count({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
  
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Cannot deactivate the only active administrator',
        );
      }
    }
  
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          id: targetUserId,
        },
        data: {
          status,
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          created_at: true,
        },
      });
  
      await tx.auditLog.create({
        data: {
          actor_id: currentUserId,
          action: 'USER_STATUS_UPDATED',
          resource: 'USER',
          target_id: targetUserId,
          metadata: {
            previousStatus: targetUser.status,
            newStatus: status,
          },
        },
      });
  
      return user;
    });
  
    return updatedUser;
  }
}
