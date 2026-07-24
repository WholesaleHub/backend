import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-products.dto';
import { contains } from 'class-validator';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}
    private getStockStatus(stock: number): string {
      if (stock === 0) {
        return 'OUT_OF_STOCK';
      }
    
      if (stock <= 20) {
        return 'LOW_STOCK';
      }
    
      return 'IN_STOCK';
    }

    async create(createProductDto: CreateProductDto) {
      return this.prisma.product.create({
        data: {
          ...createProductDto,
          status: 'ACTIVE',
        }
        });
      }

    async findAll(query: QueryProductDto) {
      const {
        search,
        category,
        availability,
        page,
        limit,
      } = query;

      const currentPage = page ?? 1;
      const currentLimit = limit ?? 10;

      const skip = (currentPage - 1) * currentLimit;

      const where: any = {}
      if (search) {
        where.product_name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (category) {
        where.category_id = category;
      }

      if (availability === 'OUT_OF_STOCK') {
        where.stock_quantity = 0;
      }
      
      if (availability === 'LOW_STOCK') {
        where.stock_quantity = {
          gt: 0,
          lte: 20,
        };
      }
      
      if (availability === 'IN_STOCK') {
        where.stock_quantity = {
          gt: 20,
        };
      }
      const total = await this.prisma.product.count({
        where,
      });
      const products = await this.prisma.product.findMany({
        where,
        include: {
            category: true,
          },
        skip,
        take: currentLimit,
        });
        return{ data: products.map(product => ({
          ...product,
          stock_status: this.getStockStatus(product.stock_quantity),
        })),

        meta: {
          total,
          page: currentPage,
          limit: currentLimit,
          totalPages: Math.ceil(total /currentLimit),
        },
      };
    }

    async findOne(product_id: number) {
      const product = await this.prisma.product.findUnique({
        where: { product_id },
        include: {
            category: true,
        },
      }); 
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return {
        ...product,
        stock_status: this.getStockStatus(product.stock_quantity),
      };
      }

    async update(product_id: number, updateProductDto: UpdateProductDto) {
      if (
        updateProductDto.stock_quantity !== undefined &&
      updateProductDto.stock_quantity < 0
    ){
      throw new BadRequestException(
        'Stock quantity cannot be negative',
      );
    }
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
