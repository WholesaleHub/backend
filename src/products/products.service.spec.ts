import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { ImageService } from '../common/images/image.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const mockPrismaService = {
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const mockImageService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findAll', () => {
    it('should return paginated products with metadata', async () => {
      const products = [
        {
          product_id: 1,
          product_name: 'Milk',
          stock_quantity: 30,
        },
        {
          product_id: 2,
          product_name: 'Bread',
          stock_quantity: 10,
        },
      ];

      mockPrismaService.product.count.mockResolvedValue(2);
      mockPrismaService.product.findMany.mockResolvedValue(products);

      const result = await service.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(result.data).toEqual([
        {
          ...products[0],
          stock_status: 'IN_STOCK',
        },
        {
          ...products[1],
          stock_status: 'LOW_STOCK',
        },
      ]);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });
    it('should search products by name', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll({
        search: 'milk',
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            product_name: {
              contains: 'milk',
              mode: 'insensitive',
            },
          },
        }),
      );
    });

    it('should filter products by category', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll({
        category: 2,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            category_id: 2,
          },
        }),
      );
    });

    it('should filter products by availability', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll({
        availability: 'LOW_STOCK',
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stock_quantity: {
              gt: 0,
              lte: 20,
            },
          },
        }),
      );
    });

    it('should filter products by price range', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll({
        minPrice: 100,
        maxPrice: 500,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            unit_price: {
              gte: 100,
              lte: 500,
            },
          },
        }),
      );
    });

    it('should combine search, category, availability and price filters', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll({
        search: 'milk',
        category: 2,
        availability: 'IN_STOCK',
        minPrice: 100,
        maxPrice: 500,
        page: 2,
        limit: 20,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            product_name: {
              contains: 'milk',
              mode: 'insensitive',
            },
            category_id: 2,
            stock_quantity: {
              gt: 20,
            },
            unit_price: {
              gte: 100,
              lte: 500,
            },
          },
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should reject when minimum price is greater than maximum price', async () => {
      await expect(
        service.findAll({
          minPrice: 1000,
          maxPrice: 500,
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow('Minimum price cannot be greater than maximum price');

      expect(mockPrismaService.product.count).not.toHaveBeenCalled();
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
    });
  });
});
