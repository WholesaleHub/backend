import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}  

  findAll() {
    return this.prisma.user.findMany();
  }

  create() {
    return this.prisma.user.create({
      data: {
        full_name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'temporary-hash',
      },
    }); 
  }
}