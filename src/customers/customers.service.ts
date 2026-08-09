import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryCustomersDto } from './dto/query-customers.dto';

@Injectable()
export class CustomersService {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    create() {
        throw new Error('Not implemented');
    }

    async findAll(query: QueryCustomersDto) {
        const {
            page = 1,
            limit = 10,
            search,
            status,
        } = query;
      
        const skip = (page - 1) * limit;
      
        const where: any = {};
      
        if (search) {
            where.OR = [
            {
              business_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              contact_person: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ];
        }
      
        if (status) {
          where.status = status;
        }
      
        const customers = await this.prisma.customer.findMany({
          where,
          include: {
            user: true,
          },
          skip,
          take: limit,
          orderBy: {
            created_at: 'desc',
          },
        });
      
        const total = await this.prisma.customer.count({
          where,
        });
      
        return {
          data: customers,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      }

    findMe(userId: string){
        return this.prisma.customer.findUnique({
            where: {
                user_id: userId,
            },
            include: {
                user: true,
            },
        });
    }

    findOne(id: number) {
        return this.prisma.customer.findUnique({
            where: {
                customer_id: id,
            },
            include: {
                user: true,
            },
        });
    }

    findByUser(userId: string) {}

    async update(userId: string, dto: UpdateCustomerDto){
        const customer = await this.prisma.customer.findUnique({
            where: {
                user_id: userId,
            },
        });
        if (!customer) {
            throw new NotFoundException('Customer profile not found');
        }
        return this.prisma.customer.update({
            where: {
                customer_id: customer.customer_id,
            },
            data: {
                business_name: dto.business_name,
                business_location: dto.business_location,
                contact_person: dto.contact_person,
                phone: dto.phone,
            },
            include: {
                user: true,
            },
        });
    }

    async changeStatus(id: number, status: string) {
      const customer = await this.prisma.customer.findUnique({
        where: {
          customer_id: id,
        },
      });
    
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    
      return this.prisma.customer.update({
        where: {
          customer_id: id,
        },
        data: {
          status,
        },
        include: {
          user: true,
        },
      });
    }

    async findCustomerOrders(customerId: number) {
      const customer = await this.prisma.customer.findUnique({
        where: {
          customer_id: customerId,
        },
      });
    
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    
      return this.prisma.order.findMany({
        where: {
          customer_id: customerId,
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          order_date: 'desc',
        },
      });
    }
}
