import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class CustomersService {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    create() {
        throw new Error('Not implemented');
    }

    findAll() {
        throw new Error('Not implemented');
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

    changeStatus(id: number) {
        throw new Error('Not implemented');
    }
}
