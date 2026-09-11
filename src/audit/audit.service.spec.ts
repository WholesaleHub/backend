import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an audit log', async () => {
      const auditLog = {
        audit_log_id: 1,
        actor_id: 'admin-1',
        action: 'UPDATE_USER_STATUS',
        resource: 'USER',
        target_id: 'user-1',
        metadata: {
          oldStatus: 'ACTIVE',
          newStatus: 'INACTIVE',
        },
        created_at: new Date(),
      };

      prisma.auditLog.create.mockResolvedValue(auditLog);

      const result = await service.create(
        'admin-1',
        'UPDATE_USER_STATUS',
        'USER',
        'user-1',
        {
          oldStatus: 'ACTIVE',
          newStatus: 'INACTIVE',
        },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actor_id: 'admin-1',
          action: 'UPDATE_USER_STATUS',
          resource: 'USER',
          target_id: 'user-1',
          metadata: {
            oldStatus: 'ACTIVE',
            newStatus: 'INACTIVE',
          },
        },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(auditLog);
    });

    it('should create an audit log without optional targetId and metadata', async () => {
      const auditLog = {
        audit_log_id: 2,
        actor_id: 'admin-1',
        action: 'VIEW_USERS',
        resource: 'USER',
        target_id: null,
        metadata: null,
        created_at: new Date(),
      };

      prisma.auditLog.create.mockResolvedValue(auditLog);

      const result = await service.create('admin-1', 'VIEW_USERS', 'USER');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actor_id: 'admin-1',
          action: 'VIEW_USERS',
          resource: 'USER',
          target_id: undefined,
          metadata: undefined,
        },
      });

      expect(result).toEqual(auditLog);
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs using default pagination', async () => {
      const auditLogs = [
        {
          audit_log_id: 2,
          actor_id: 'admin-1',
          action: 'UPDATE_USER_STATUS',
          resource: 'USER',
          target_id: 'user-2',
        },
        {
          audit_log_id: 1,
          actor_id: 'admin-1',
          action: 'UPDATE_USER_STATUS',
          resource: 'USER',
          target_id: 'user-1',
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(auditLogs);
      prisma.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          created_at: 'desc',
        },
      });

      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(result).toEqual({
        data: auditLogs,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should apply custom pagination', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(25);

      const result = await service.findAll(2, 10);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: {
          created_at: 'desc',
        },
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should filter audit logs by action', async () => {
      const auditLogs = [
        {
          audit_log_id: 1,
          actor_id: 'admin-1',
          action: 'UPDATE_USER_STATUS',
          resource: 'USER',
          target_id: 'user-1',
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(auditLogs);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, 'UPDATE_USER_STATUS');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: 'UPDATE_USER_STATUS',
        },
        skip: 0,
        take: 10,
        orderBy: {
          created_at: 'desc',
        },
      });

      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          action: 'UPDATE_USER_STATUS',
        },
      });

      expect(result.data).toEqual(auditLogs);
      expect(result.pagination.total).toBe(1);
    });

    it('should calculate totalPages correctly', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(21);

      const result = await service.findAll(1, 10);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('should return zero totalPages when there are no audit logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });
});
