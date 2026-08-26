import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';

type ValidatedItem = {
  product: NonNullable<
    Awaited<ReturnType<typeof this.prisma.product.findUnique>>
  >;
  quantity: number;
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, user: any) {
    const { items } = createOrderDto;
    const customerId = user.customerId;
    const userId = user.userId;

    const validatedItems: ValidatedItem[] = [];
    // Validate every ordered product
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: {
          product_id: item.product_id,
        },
      });
      if (!product) {
        throw new BadRequestException(
          `Product with ID ${item.product_id} does not exist.`,
        );
      }
      if (item.quantity > product.stock_quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.product_name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`,
        );
      }
      validatedItems.push({
        product,
        quantity: item.quantity,
      });
    }
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.product.unit_price * item.quantity,
      0,
    );
    return this.prisma.$transaction(async (tx) => {
      for (const { product, quantity } of validatedItems) {
        const updated = await tx.product.updateMany({
          where: {
            product_id: product.product_id,
            stock_quantity: {
              gte: quantity,
            },
          },
          data: {
            stock_quantity: {
              decrement: quantity,
            },
          },
        });
        
        if (updated.count !== 1) {
          throw new BadRequestException(
            `Insufficient stock for "${product.product_name}".`,
          );
        }
      }
      return tx.order.create({
        data: {
          customer_id: customerId,
          created_by_user_id: userId,
          total_amount: totalAmount,
          orderItems: {
            create: validatedItems.map(({ product, quantity }) => ({
              product_id: product.product_id,
              quantity,
              unit_price: product.unit_price,
              subtotal: product.unit_price * quantity,
            })),
          },
        },
        include: {
          customer: true,
          orderItems: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        createdBy: true,
      },
    });
  }
  async findMyOrders(customerId: number) {
    return this.prisma.order.findMany({
      where: {
        customer_id: customerId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
      orderBy: {
        order_date: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.order.findUnique({
      where: {
        order_id: id,
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        createdBy: true,
      },
    });
  }

  async findAllOrders(
    status?: OrderStatus,
    customer?: string,
    sort: 'asc' | 'desc' = 'desc',
  ) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    if (customer) {
      where.customer = {
        business_name: {
          contains: customer,
          mode: 'insensitive',
        },
      };
    }
    return this.prisma.order.findMany({
      where,

      include: {
        customer: true,

        orderItems: {
          include: {
            product: true,
          },
        },

        createdBy: true,
      },

      orderBy: {
        order_date: sort,
      },
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.prisma.order.update({
      where: {
        order_id: id,
      },
      data: updateOrderDto,
    });
  }

  async remove(id: number) {
    try {
      return this.prisma.order.delete({
        where: {
          order_id: id,
        },
      });
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    return this.prisma.order.update({
      where: {
        order_id: id,
      },
      data: {
        status: dto.status,
      },
    });
  }
}
