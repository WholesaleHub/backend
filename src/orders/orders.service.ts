import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}

    async create(createOrderDto: CreateOrderDto) {
      try {
        const { customer_id, items } = createOrderDto;
      
        return await this.prisma.order.create({
          data: {
            customer_id,
      
            // Temporary value until JWT authentication is wired in
            created_by_user_id: '58d34595-7144-4208-88b8-20061fcb779c',
      
            orderItems: {
              create: items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
      
                // Temporary placeholders
                unit_price: 0,
                subtotal: 0,
              })),
            },
          },
      
          include: {
            customer: true,
            orderItems: true,
          },
        });
      } catch (error) {
        console.log(JSON.stringify(error, null, 2));
        throw error;
      }
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
      return await this.prisma.order.update({
          where: {
            order_id: id,
          },
          data: updateOrderDto,
        });
      }

    async remove(id: number) {
      try {
        return await this.prisma.order.delete({
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
