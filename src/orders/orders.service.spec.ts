import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMyOrders', () => {
    it('should return only orders belonging to the authenticated customer', async () => {
      const customerId = 5;

      const orders = [
        {
          order_id: 12,
          customer_id: 5,
          status: 'PENDING',
        },
        {
          order_id: 10,
          customer_id: 5,
          status: 'DELIVERED',
        },
      ];

      prisma.$transaction.mockResolvedValue([orders, 2]);

      const result = await service.findMyOrders(customerId, 1, 10);

      expect(prisma.$transaction).toHaveBeenCalled();

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            customer_id: customerId,
          },
          orderBy: {
            order_date: 'desc',
          },
          skip: 0,
          take: 10,
        }),
      );

      expect(result).toEqual({
        data: orders,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should calculate pagination correctly', async () => {
      prisma.$transaction.mockResolvedValue([[], 25]);

      const result = await service.findMyOrders(5, 2, 10);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            customer_id: 5,
          },
          skip: 10,
          take: 10,
        }),
      );

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('findMyOrderById', () => {
    it('should retrieve an order when it belongs to the authenticated customer', async () => {
      const order = {
        order_id: 12,
        customer_id: 5,
        status: 'PENDING',
      };

      prisma.order.findFirst.mockResolvedValue(order);

      const result = await service.findMyOrderById(12, 5);

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            order_id: 12,
            customer_id: 5,
          },
        }),
      );

      expect(result).toEqual(order);
    });

    it("should prevent access to another customer's order", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.findMyOrderById(12, 5),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            order_id: 12,
            customer_id: 5,
          },
        }),
      );
    });
  });
});