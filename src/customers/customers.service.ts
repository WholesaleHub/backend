import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CustomersService {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    create() {}

    findAll() {}

    findOne(id: number) {}

    findByUser(userId: string) {}

    update(id: number) {}

    changeStatus(id: number) {}
}
