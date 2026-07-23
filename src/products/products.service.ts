import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    async create(createProductDto: CreateProductDto) {
      return this.prisma.product.create({
        data: {
          ...createProductDto,
          status: 'ACTIVE',
        }
        });
      }

    async findAll() {
      return this.prisma.product.findMany(
        {
          include: {
            category: true,
          },
        }
      );
      }

    async findOne(product_id: number) {
      return this.prisma.product.findUnique({
        where: {
          product_id,
          },
          include: {
            category: true,
          },
        });
      }

    async update(product_id: number, updateProductDto: UpdateProductDto) {
      return this.prisma.product.update({
          where: {
            product_id,
          },
          data: updateProductDto,
        });
      }

    async remove(product_id: number) {
      return this.prisma.product.delete({
          where: {
            product_id,
          },
        });
      }
}
