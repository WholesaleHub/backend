import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type ValidatedItem = {
  product: NonNullable<
    Awaited<ReturnType<typeof this.prisma.product.findUnique>>
  >;
  quantity: number;
};

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}

    async create(createOrderDto: CreateOrderDto) {      
        const { customer_id, items } = createOrderDto;      
        
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
          return this.prisma.$transaction(async (tx) => ({
          data: {
            customer_id,
      
            // Temporary value until JWT authentication is wired in
            created_by_user_id: '58d34595-7144-4208-88b8-20061fcb779c',
            total_amount: totalAmount,
      
            orderItems: {
              create: validatedItems.map(({product, quantity} ) => ({
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
        }));      
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
      }
      catch (error) {
        console.log(JSON.stringify(error, null, 2));
        throw error;
      }
    }

    async updateStatus(
      id: number,
      dto: UpdateOrderStatusDto,
    ) {
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