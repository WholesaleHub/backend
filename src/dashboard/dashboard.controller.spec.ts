import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getStats: jest.fn(),
    getDashboardStats: jest.fn(),
    getSalesAnalytics: jest.fn(),
    getCustomerDashboard: jest.fn(),
    getTopProducts: jest.fn(),
    getLowStockProducts: jest.fn(),
    getCustomerAnalytics: jest.fn(),
    getRecentOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return general dashboard stats', async () => {
      const expectedResult = {
        totalProducts: 10,
        totalCategories: 4,
        lowStockProducts: 2,
      };

      mockDashboardService.getStats.mockResolvedValue(expectedResult);

      const result = await controller.getStats();

      expect(service.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDashboardStats', () => {
    it('should return admin dashboard stats', async () => {
      const expectedResult = {
        totalOrders: 11,
        pendingOrders: 5,
        deliveredOrders: 3,
        totalProducts: 20,
        totalCategories: 5,
        lowStockProducts: 4,
        revenueSummary: 12262,
      };

      mockDashboardService.getDashboardStats.mockResolvedValue(expectedResult);

      const result = await controller.getDashboardStats();

      expect(service.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSalesAnalytics', () => {
    it('should return sales analytics without date filters', async () => {
      const expectedResult = {
        totalRevenue: 12262,
        totalOrders: 11,
        ordersByStatus: [],
        salesOverTime: [],
      };

      mockDashboardService.getSalesAnalytics.mockResolvedValue(expectedResult);

      const result = await controller.getSalesAnalytics({});

      expect(service.getSalesAnalytics).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should pass startDate and endDate to the service', async () => {
      const query = {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };

      const expectedResult = {
        totalRevenue: 5000,
        totalOrders: 4,
        ordersByStatus: [],
        salesOverTime: [],
      };

      mockDashboardService.getSalesAnalytics.mockResolvedValue(expectedResult);

      const result = await controller.getSalesAnalytics(query);

      expect(service.getSalesAnalytics).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-31',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getCustomerDashboard', () => {
    it('should pass the authenticated user to the service', async () => {
      const req = {
        user: {
          userId: 'user-123',
          customerId: 2,
          role: 'RETAILER',
        },
      };

      const expectedResult = {
        totalOrders: 5,
        pendingOrders: 2,
        confirmedOrders: 1,
        packedOrders: 0,
        shippedOrders: 1,
        deliveredOrders: 1,
        cancelledOrders: 0,
        recentOrders: [],
      };

      mockDashboardService.getCustomerDashboard.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getCustomerDashboard(req);

      expect(service.getCustomerDashboard).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTopProducts', () => {
    it('should return top-selling products', async () => {
      const expectedResult = [
        {
          productId: 25,
          productName: 'Coca cola 2L',
          sku: 'Coc-2',
          quantitySold: 64,
          revenue: 10000,
          orderCount: 8,
        },
      ];

      mockDashboardService.getTopProducts.mockResolvedValue(expectedResult);

      const result = await controller.getTopProducts();

      expect(service.getTopProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low-stock products', async () => {
      const expectedResult = [
        {
          productId: 1,
          productName: 'Test Product',
          sku: 'TEST-001',
          stockQuantity: 10,
          stockStatus: 'LOW_STOCK',
        },
      ];

      mockDashboardService.getLowStockProducts.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getLowStockProducts();

      expect(service.getLowStockProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return customer analytics without date filters', async () => {
      const expectedResult = {
        totalCustomers: 3,
        newCustomers: 3,
        newCustomersOverTime: [],
        recentCustomers: [],
      };

      mockDashboardService.getCustomerAnalytics.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getCustomerAnalytics({});

      expect(service.getCustomerAnalytics).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should pass date filters to the service', async () => {
      const query = {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };

      const expectedResult = {
        totalCustomers: 3,
        newCustomers: 2,
        newCustomersOverTime: [],
        recentCustomers: [],
      };

      mockDashboardService.getCustomerAnalytics.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getCustomerAnalytics(query);

      expect(service.getCustomerAnalytics).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-31',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders', async () => {
      const expectedResult = [
        {
          orderId: 22,
          status: 'PENDING',
          totalAmount: 500,
          customer: {
            customer_id: 2,
            business_name: 'Test Shop',
          },
          itemCount: 3,
          items: [],
        },
      ];

      mockDashboardService.getRecentOrders.mockResolvedValue(expectedResult);

      const result = await controller.getRecentOrders();

      expect(service.getRecentOrders).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });
});
