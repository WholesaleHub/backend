import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CartService', () => {
  let service: CartService;

  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },

    cartItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },

    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);

    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return the customer cart', async () => {
      const customerId = 4;

      const cart = {
        cart_id: 1,
        customer_id: customerId,
        items: [
          {
            cart_item_id: 1,
            product_id: 30,
            quantity: 2,
            product: {
              product_id: 30,
              product_name: 'Test Product',
              stock_quantity: 20,
            },
          },
        ],
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(cart);

      const result = await service.getCart(customerId);

      expect(result).toEqual(cart);

      expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith({
        where: {
          customer_id: customerId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });
    });

    it('should return null when the customer has no cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);

      const result = await service.getCart(4);

      expect(result).toBeNull();
    });
  });

  describe('addItem', () => {
    const customerId = 4;

    const product = {
      product_id: 30,
      product_name: 'Test Product',
      status: 'ACTIVE',
      stock_quantity: 20,
      unit_price: 100,
    };

    const cart = {
      cart_id: 1,
      customer_id: customerId,
    };

    it('should add a new product to the cart', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      mockPrismaService.cart.upsert.mockResolvedValue(cart);

      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);

      mockPrismaService.cartItem.create.mockResolvedValue({
        cart_item_id: 1,
        cart_id: 1,
        product_id: 30,
        quantity: 2,
      });

      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...cart,
        items: [
          {
            cart_item_id: 1,
            product_id: 30,
            quantity: 2,
          },
        ],
      });

      const result = await service.addItem(customerId, {
        product_id: 30,
        quantity: 2,
      });

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: {
          product_id: 30,
        },
      });

      expect(mockPrismaService.cart.upsert).toHaveBeenCalledWith({
        where: {
          customer_id: customerId,
        },
        update: {},
        create: {
          customer_id: customerId,
        },
      });

      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: {
          cart_id: 1,
          product_id: 30,
          quantity: 2,
        },
      });

      expect(result).toBeDefined();
    });

    it('should increase quantity when product already exists in cart', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      mockPrismaService.cart.upsert.mockResolvedValue(cart);

      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        cart_item_id: 7,
        cart_id: 1,
        product_id: 30,
        quantity: 3,
      });

      mockPrismaService.cartItem.update.mockResolvedValue({
        cart_item_id: 7,
        cart_id: 1,
        product_id: 30,
        quantity: 5,
      });

      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...cart,
        items: [
          {
            cart_item_id: 7,
            product_id: 30,
            quantity: 5,
          },
        ],
      });

      await service.addItem(customerId, {
        product_id: 30,
        quantity: 2,
      });

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: {
          cart_item_id: 7,
        },
        data: {
          quantity: 5,
        },
      });

      expect(mockPrismaService.cartItem.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(customerId, {
          product_id: 999,
          quantity: 2,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.cart.upsert).not.toHaveBeenCalled();
    });

    it('should reject an inactive product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...product,
        status: 'INACTIVE',
      });

      await expect(
        service.addItem(customerId, {
          product_id: 30,
          quantity: 2,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.cart.upsert).not.toHaveBeenCalled();
    });

    it('should reject quantity greater than available stock', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...product,
        stock_quantity: 5,
      });

      await expect(
        service.addItem(customerId, {
          product_id: 30,
          quantity: 10,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.cart.upsert).not.toHaveBeenCalled();
    });

    it('should reject when existing quantity plus new quantity exceeds stock', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...product,
        stock_quantity: 10,
      });

      mockPrismaService.cart.upsert.mockResolvedValue(cart);

      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        cart_item_id: 7,
        cart_id: 1,
        product_id: 30,
        quantity: 8,
      });

      await expect(
        service.addItem(customerId, {
          product_id: 30,
          quantity: 5,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.cartItem.update).not.toHaveBeenCalled();
    });
  });
});