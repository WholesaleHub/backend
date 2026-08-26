import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { AddCartItemDto } from './dto/add-cart-item.dto';
  import { UpdateCartItemDto } from './dto/update-cart-item.dto';
  
  @Injectable()
  export class CartService {
    constructor(private readonly prisma: PrismaService) {}
  
    async getCart(customerId: number) {
      return this.prisma.cart.findUnique({
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
    }
  
    async addItem(customerId: number, dto: AddCartItemDto) {
      const product = await this.prisma.product.findUnique({
        where: {
          product_id: dto.product_id,
        },
      });
  
      if (!product) {
        throw new NotFoundException('Product not found');
      }
  
      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          'This product is not currently available',
        );
      }
  
      if (dto.quantity > product.stock_quantity) {
        throw new BadRequestException(
          `Only ${product.stock_quantity} units of "${product.product_name}" are currently available`,
        );
      }
  
      const cart = await this.prisma.cart.upsert({
        where: {
          customer_id: customerId,
        },
        update: {},
        create: {
          customer_id: customerId,
        },
      });
  
      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cart_id_product_id: {
            cart_id: cart.cart_id,
            product_id: dto.product_id,
          },
        },
      });
  
      if (existingItem) {
        const newQuantity = existingItem.quantity + dto.quantity;
  
        if (newQuantity > product.stock_quantity) {
          throw new BadRequestException(
            `Only ${product.stock_quantity} units of "${product.product_name}" are currently available`,
          );
        }
  
        await this.prisma.cartItem.update({
          where: {
            cart_item_id: existingItem.cart_item_id,
          },
          data: {
            quantity: newQuantity,
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cart_id: cart.cart_id,
            product_id: dto.product_id,
            quantity: dto.quantity,
          },
        });
      }
  
      return this.getCart(customerId);
    }

    async updateItem(
      customerId: number,
      cartItemId: number,
      dto: UpdateCartItemDto,
    ) {
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          cart_item_id: cartItemId,
          cart: {
            customer_id: customerId,
          },
        },
        include: {
          product: true,
        },
      });
    
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
    
      if (cartItem.product.status !== 'ACTIVE') {
        throw new BadRequestException(
          'This product is not currently available',
        );
      }
    
      if (dto.quantity > cartItem.product.stock_quantity) {
        throw new BadRequestException(
          `Only ${cartItem.product.stock_quantity} units of "${cartItem.product.product_name}" are currently available`,
        );
      }
    
      await this.prisma.cartItem.update({
        where: {
          cart_item_id: cartItemId,
        },
        data: {
          quantity: dto.quantity,
        },
      });
    
      return this.getCart(customerId);
    }
    
    async removeItem(customerId: number, cartItemId: number) {
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          cart_item_id: cartItemId,
          cart: {
            customer_id: customerId,
          },
        },
      });
    
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
    
      await this.prisma.cartItem.delete({
        where: {
          cart_item_id: cartItemId,
        },
      });
    
      return this.getCart(customerId);
    }
    
    async clearCart(customerId: number) {
      const cart = await this.prisma.cart.findUnique({
        where: {
          customer_id: customerId,
        },
      });
    
      if (!cart) {
        return null;
      }
    
      await this.prisma.cartItem.deleteMany({
        where: {
          cart_id: cart.cart_id,
        },
      });
    
      return this.getCart(customerId);
    }
  }