import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

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
        {
          id: 'user-2',
          full_name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      ];

      mockUsersService.findAll.mockResolvedValue(users);

      const query = {};

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it('should pass search, role and status filters to the service', async () => {
      const query = {
        search: 'john',
        role: 'RETAILER',
        status: 'ACTIVE',
      };

      const users = [
        {
          id: 'user-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: 'RETAILER',
          status: 'ACTIVE',
        },
      ];

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        'john',
        'RETAILER',
        'ACTIVE',
      );

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it('should pass partial filters to the service', async () => {
      const query = {
        search: 'john',
        role: undefined,
        status: 'ACTIVE',
      };

      mockUsersService.findAll.mockResolvedValue([]);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        'john',
        undefined,
        'ACTIVE',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update a user status', async () => {
      const userId = 'user-1';

      const dto = {
        status: 'INACTIVE',
      };

      const req = {
        user: {
          userId: 'admin-1',
          role: 'ADMIN',
        },
      };

      const updatedUser = {
        id: userId,
        full_name: 'John Doe',
        email: 'john@example.com',
        role: 'RETAILER',
        status: 'INACTIVE',
      };

      mockUsersService.updateStatus.mockResolvedValue(updatedUser);

      const result = await controller.updateStatus(
        userId,
        dto,
        req,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        userId,
        'INACTIVE',
        'admin-1',
      );

      expect(service.updateStatus).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it('should pass the authenticated admin userId to the service', async () => {
      const dto = {
        status: 'ACTIVE',
      };

      const req = {
        user: {
          userId: 'admin-123',
          role: 'ADMIN',
        },
      };

      mockUsersService.updateStatus.mockResolvedValue({
        id: 'user-5',
        status: 'ACTIVE',
      });

      await controller.updateStatus(
        'user-5',
        dto,
        req,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        'user-5',
        'ACTIVE',
        'admin-123',
      );
    });
  });
});