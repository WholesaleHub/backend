import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

describe('CartController', () => {
  let controller: CartController;
  let cartService: {
    getCart: jest.Mock;
    addItem: jest.Mock;
    updateItem: jest.Mock;
    removeItem: jest.Mock;
    clearCart: jest.Mock;
  };

  const mockRequest = {
    user: {
      userId: 'test-user-id',
      email: 'retailer@example.com',
      role: 'RETAILER',
      customerId: 4,
    },
  };

  beforeEach(async () => {
    cartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: cartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should return the authenticated retailer cart', async () => {
      const mockCart = {
        cart_id: 1,
        customer_id: 4,
        items: [],
      };

      cartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart(mockRequest as any);

      expect(cartService.getCart).toHaveBeenCalledWith(4);
      expect(cartService.getCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCart);
    });
  });

  describe('addItem', () => {
    it('should add an item to the authenticated retailer cart', async () => {
      const dto: AddCartItemDto = {
        product_id: 30,
        quantity: 2,
      };

      const mockCart = {
        cart_id: 1,
        customer_id: 4,
        items: [
          {
            cart_item_id: 1,
            product_id: 30,
            quantity: 2,
          },
        ],
      };

      cartService.addItem.mockResolvedValue(mockCart);

      const result = await controller.addItem(mockRequest as any, dto);

      expect(cartService.addItem).toHaveBeenCalledWith(4, dto);
      expect(cartService.addItem).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCart);
    });
  });

  describe('updateItem', () => {
    it('should update a cart item quantity', async () => {
      const cartItemId = 1;

      const dto: UpdateCartItemDto = {
        quantity: 5,
      };

      const mockCart = {
        cart_id: 1,
        customer_id: 4,
        items: [
          {
            cart_item_id: cartItemId,
            product_id: 30,
            quantity: 5,
          },
        ],
      };

      cartService.updateItem.mockResolvedValue(mockCart);

      const result = await controller.updateItem(
        mockRequest as any,
        cartItemId.toString(),
        dto,
      );

      expect(cartService.updateItem).toHaveBeenCalledWith(4, cartItemId, dto);

      expect(result).toEqual(mockCart);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the authenticated retailer cart', async () => {
      const cartItemId = 1;

      const mockCart = {
        cart_id: 1,
        customer_id: 4,
        items: [],
      };

      cartService.removeItem.mockResolvedValue(mockCart);

      const result = await controller.removeItem(
        mockRequest as any,
        cartItemId.toString(),
      );

      expect(cartService.removeItem).toHaveBeenCalledWith(4, cartItemId);

      expect(result).toEqual(mockCart);
    });
  });

  describe('clearCart', () => {
    it('should clear the authenticated retailer cart', async () => {
      const mockResult = {
        message: 'Cart cleared successfully',
      };

      cartService.clearCart.mockResolvedValue(mockResult);

      const result = await controller.clearCart(mockRequest as any);

      expect(cartService.clearCart).toHaveBeenCalledWith(4);
      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });
});
