import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

    async findAll() {
      const products = await this.prisma.product.findMany({
        include: {
            category: true,
          },
        });
        return products.map(product => ({
          ...product,
          stock_status: this.getStockStatus(product.stock_quantity),
        }));
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
