import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  const prismaMock = {
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
    },
    customer: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return product, category and low-stock counts', async () => {
      prisma.product.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(4);

      prisma.category.count.mockResolvedValue(6);

      const result = await service.getStats();

      expect(result).toEqual({
        totalProducts: 20,
        totalCategories: 6,
        lowStockProducts: 4,
      });

      expect(prisma.product.count).toHaveBeenLastCalledWith({
        where: {
          stock_quantity: {
            lte: 20,
          },
        },
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should return the existing admin dashboard summary', async () => {
      prisma.order.count
        .mockResolvedValueOnce(11)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      prisma.product.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2);

      prisma.category.count.mockResolvedValue(4);

      prisma.order.aggregate.mockResolvedValue({
        _sum: {
          total_amount: 12262,
        },
      });

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalOrders: 11,
        pendingOrders: 5,
        deliveredOrders: 3,
        totalProducts: 10,
        totalCategories: 4,
        lowStockProducts: 2,
        revenueSummary: 12262,
      });
    });

    it('should return zero revenue when no revenue exists', async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.category.count.mockResolvedValue(0);

      prisma.order.aggregate.mockResolvedValue({
        _sum: {
          total_amount: null,
        },
      });

      const result = await service.getDashboardStats();

      expect(result.revenueSummary).toBe(0);
    });
  });

  describe('getCustomerDashboard', () => {
    it('should return dashboard statistics for the logged-in customer', async () => {
      prisma.order.count
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      const recentOrders = [
        {
          order_id: 22,
          customer_id: 2,
          status: OrderStatus.PENDING,
          orderItems: [],
        },
      ];

      prisma.order.findMany.mockResolvedValue(recentOrders);

      const result = await service.getCustomerDashboard({
        customerId: 2,
      });

      expect(result).toEqual({
        totalOrders: 7,
        pendingOrders: 1,
        confirmedOrders: 1,
        packedOrders: 1,
        shippedOrders: 1,
        deliveredOrders: 2,
        cancelledOrders: 1,
        recentOrders,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            customer_id: 2,
          },
          take: 5,
        }),
      );
    });
  });

  describe('getSalesAnalytics', () => {
    it('should calculate revenue, orders by status and sales over time', async () => {
      prisma.order.count.mockResolvedValue(11);

      prisma.order.aggregate.mockResolvedValue({
        _sum: {
          total_amount: 12262,
        },
      });

      prisma.order.groupBy
        .mockResolvedValueOnce([
          {
            status: OrderStatus.PENDING,
            _count: {
              order_id: 7,
            },
          },
          {
            status: OrderStatus.DELIVERED,
            _count: {
              order_id: 4,
            },
          },
        ])
        .mockResolvedValueOnce([
          {
            order_date: new Date('2026-08-01T21:20:41.360Z'),
            _sum: {
              total_amount: 2250,
            },
            _count: {
              order_id: 1,
            },
          },
        ]);

      const result = await service.getSalesAnalytics();

      expect(result).toEqual({
        totalRevenue: 12262,
        totalOrders: 11,
        ordersByStatus: [
          {
            status: OrderStatus.PENDING,
            count: 7,
          },
          {
            status: OrderStatus.DELIVERED,
            count: 4,
          },
        ],
        salesOverTime: [
          {
            date: new Date('2026-08-01T21:20:41.360Z'),
            revenue: 2250,
            orders: 1,
          },
        ],
      });
    });

    it('should apply start and end date filters', async () => {
      prisma.order.count.mockResolvedValue(2);

      prisma.order.aggregate.mockResolvedValue({
        _sum: {
          total_amount: 3000,
        },
      });

      prisma.order.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getSalesAnalytics('2026-08-01', '2026-08-31');

      const countCall = prisma.order.count.mock.calls[0][0];

      expect(countCall.where.order_date.gte).toEqual(
        new Date('2026-08-01'),
      );

      expect(countCall.where.order_date.lte).toEqual(
        new Date('2026-08-31T23:59:59.999'),
      );
    });

    it('should return zero revenue when there are no sales', async () => {
      prisma.order.count.mockResolvedValue(0);

      prisma.order.aggregate.mockResolvedValue({
        _sum: {
          total_amount: null,
        },
      });

      prisma.order.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getSalesAnalytics();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
    });
  });

  describe('getTopProducts', () => {
    it('should return top-selling products', async () => {
      prisma.orderItem.groupBy.mockResolvedValue([
        {
          product_id: 25,
          _sum: {
            quantity: 64,
            subtotal: 10000,
          },
          _count: {
            order_item_id: 8,
          },
        },
      ]);

      prisma.product.findMany.mockResolvedValue([
        {
          product_id: 25,
          product_name: 'Coca cola 2L',
          sku: 'Coc-2',
          unit_price: 250,
          stock_quantity: 39,
        },
      ]);

      const result = await service.getTopProducts();

      expect(result).toEqual([
        {
          productId: 25,
          productName: 'Coca cola 2L',
          sku: 'Coc-2',
          unitPrice: 250,
          stockQuantity: 39,
          quantitySold: 64,
          revenue: 10000,
          orderCount: 8,
        },
      ]);

      expect(prisma.orderItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should respect a custom limit', async () => {
      prisma.orderItem.groupBy.mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([]);

      await service.getTopProducts(10);

      expect(prisma.orderItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('getLowStockProducts', () => {
    it('should return active products with stock of 20 or less', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          product_id: 1,
          product_name: 'Sugar',
          sku: 'SUGAR-1',
          unit_price: 200,
          stock_quantity: 10,
          category: {
            category_id: 1,
            category_name: 'Food',
          },
        },
        {
          product_id: 2,
          product_name: 'Milk',
          sku: 'MILK-1',
          unit_price: 100,
          stock_quantity: 0,
          category: {
            category_id: 2,
            category_name: 'Dairy',
          },
        },
      ]);

      const result = await service.getLowStockProducts();

      expect(result[0].stockStatus).toBe('LOW_STOCK');
      expect(result[1].stockStatus).toBe('OUT_OF_STOCK');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stock_quantity: {
              lte: 20,
            },
            status: 'ACTIVE',
          },
        }),
      );
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return total, new and recent customers', async () => {
      const filteredCustomers = [
        {
          customer_id: 2,
          business_name: 'Test Shop',
          business_location: 'Mombasa',
          contact_person: 'Msambwa Msambwa',
          status: 'ACTIVE',
          created_at: new Date('2026-08-10'),
        },
        {
          customer_id: 3,
          business_name: 'Mwaura',
          business_location: '',
          contact_person: 'Mwaura',
          status: 'ACTIVE',
          created_at: new Date('2026-08-20'),
        },
      ];

      const recentCustomers = [filteredCustomers[1]];

      prisma.customer.count.mockResolvedValue(3);

      prisma.customer.findMany
        .mockResolvedValueOnce(filteredCustomers)
        .mockResolvedValueOnce(recentCustomers);

      const result = await service.getCustomerAnalytics(
        '2026-08-01',
        '2026-08-31',
      );

      expect(result.totalCustomers).toBe(3);
      expect(result.newCustomers).toBe(2);
      expect(result.newCustomersOverTime).toHaveLength(2);
      expect(result.recentCustomers).toEqual(recentCustomers);

      expect(result.newCustomersOverTime[0]).toEqual({
        customerId: 2,
        businessName: 'Test Shop',
        businessLocation: 'Mombasa',
        contactPerson: 'Msambwa Msambwa',
        status: 'ACTIVE',
        createdAt: new Date('2026-08-10'),
      });
    });

    it('should apply date filtering to new customers', async () => {
      prisma.customer.count.mockResolvedValue(3);

      prisma.customer.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getCustomerAnalytics(
        '2026-08-01',
        '2026-08-31',
      );

      const filteredCall =
        prisma.customer.findMany.mock.calls[0][0];

      expect(filteredCall.where.created_at.gte).toEqual(
        new Date('2026-08-01'),
      );

      expect(filteredCall.where.created_at.lte).toEqual(
        new Date('2026-08-31T23:59:59.999'),
      );
    });
  });

  describe('getRecentOrders', () => {
    it('should return the most recent orders with customer and item information', async () => {
      const orders = [
        {
          order_id: 22,
          order_date: new Date('2026-08-17T05:12:29.079Z'),
          status: OrderStatus.PENDING,
          total_amount: 500,
          customer: {
            customer_id: 2,
            business_name: 'Test Shop',
            contact_person: 'Msambwa Msambwa',
          },
          orderItems: [
            {
              quantity: 2,
              subtotal: 500,
              product: {
                product_id: 25,
                product_name: 'Coca cola 2L',
                sku: 'Coc-2',
              },
            },
          ],
        },
      ];

      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getRecentOrders();

      expect(result).toEqual([
        {
          orderId: 22,
          orderDate: new Date('2026-08-17T05:12:29.079Z'),
          status: OrderStatus.PENDING,
          totalAmount: 500,
          customer: {
            customer_id: 2,
            business_name: 'Test Shop',
            contact_person: 'Msambwa Msambwa',
          },
          itemCount: 2,
          items: orders[0].orderItems,
        },
      ]);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: {
            created_at: 'desc',
          },
        }),
      );
    });

    it('should calculate itemCount from all order items', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          order_id: 1,
          order_date: new Date(),
          status: OrderStatus.PENDING,
          total_amount: 1000,
          customer: {},
          orderItems: [
            { quantity: 2 },
            { quantity: 3 },
            { quantity: 4 },
          ],
        },
      ]);

      const result = await service.getRecentOrders();

      expect(result[0].itemCount).toBe(9);
    });
  });
});