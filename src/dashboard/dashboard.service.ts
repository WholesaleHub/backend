import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getStats() {
        const totalProducts = await this.prisma.product.count();
      
        const totalCategories = await this.prisma.category.count();
      
        const lowStockProducts = await this.prisma.product.count({
          where: {
            stock_quantity: {
              lte: 10,
            },
          },
        });
      
        return {
          totalProducts,
          totalCategories,
          lowStockProducts,
        };
      }
}
