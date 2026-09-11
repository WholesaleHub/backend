import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
        createdBy: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            is_verified: true,
            created_at: true,
          },
        },
      },
    });
  }
  async findMyOrders(customerId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      customer_id: customerId,
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
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
        skip,
        take: limit,
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findMyOrderById(orderId: number, customerId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        customer_id: customerId,
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
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
        createdBy: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            is_verified: true,
            created_at: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
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

        createdBy: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            is_verified: true,
            created_at: true,
          },
        },
      },

      orderBy: {
        order_date: sort,
      },
    });
  }

  async remove(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        order_id: id,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException('Only cancelled orders can be deleted');
    }

    return this.prisma.order.delete({
      where: {
        order_id: id,
      },
    });
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: {
        order_id: id,
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Prevent a cancelled order from being changed again
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled order cannot be updated');
    }

    // Restore inventory when cancelling the order
    if (dto.status === OrderStatus.CANCELLED) {
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          await tx.product.update({
            where: {
              product_id: item.product_id,
            },
            data: {
              stock_quantity: {
                increment: item.quantity,
              },
            },
          });
        }

        return tx.order.update({
          where: {
            order_id: id,
          },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });
      });
    }

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
