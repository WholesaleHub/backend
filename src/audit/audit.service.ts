import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actorId: string,
    action: string,
    resource: string,
    targetId?: string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actor_id: actorId,
        action,
        resource,
        target_id: targetId,
        metadata,
      },
    });
  }

  async findAll(page = 1, limit = 10, action?: string) {
    const skip = (page - 1) * limit;

    const where = action
      ? {
          action,
        }
      : {};

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.auditLog.count({
        where,
      }),
    ]);

    return {
      data: auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}