import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return audit logs', async () => {
      const expectedResult = {
        data: [
          {
            audit_log_id: 1,
            actor_id: 'admin-1',
            action: 'UPDATE_USER_STATUS',
            resource: 'USER',
            target_id: 'user-1',
            metadata: {
              oldStatus: 'ACTIVE',
              newStatus: 'INACTIVE',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockAuditService.findAll.mockResolvedValue(expectedResult);

      const query = {
        page: 1,
        limit: 10,
      };

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined);

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should pass action filter to the service', async () => {
      const query = {
        page: 1,
        limit: 10,
        action: 'UPDATE_USER_STATUS',
      };

      const expectedResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockAuditService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(1, 10, 'UPDATE_USER_STATUS');

      expect(result).toEqual(expectedResult);
    });

    it('should pass custom pagination to the service', async () => {
      const query = {
        page: 3,
        limit: 5,
      };

      mockAuditService.findAll.mockResolvedValue({
        data: [],
        pagination: {
          page: 3,
          limit: 5,
          total: 12,
          totalPages: 3,
        },
      });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(3, 5, undefined);
    });

    it('should pass undefined values when query parameters are omitted', async () => {
      const query = {};

      mockAuditService.findAll.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );

      expect(result.data).toEqual([]);
    });
  });
});
