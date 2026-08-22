import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalProducts = await this.prisma.product.count();

    const totalCategories = await this.prisma.category.count();

    const lowStockProducts = await this.prisma.product.count({
      where: {
        stock_quantity: {
          lte: 20,
        },
      },
    });

    return {
      totalProducts,
      totalCategories,
      lowStockProducts,
    };
  }

  async getDashboardStats() {
    const totalOrders = await this.prisma.order.count();
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });
    const deliveredOrders = await this.prisma.order.count({
      where: {
        status: 'DELIVERED',
      },
    });
    const totalProducts = await this.prisma.product.count();
    const totalCategories = await this.prisma.category.count();
    const lowStockProducts = await this.prisma.product.count({
      where: {
        stock_quantity: {
          lte: 20,
        },
      },
    });
    const revenue = await this.prisma.order.aggregate({
      _sum: {
        total_amount: true,
      },
    });
    const revenueSummary = revenue._sum.total_amount ?? 0;
    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalProducts,
      totalCategories,
      lowStockProducts,
      revenueSummary,
    };
  }

  async getCustomerDashboard(user: any) {
    const totalOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
      },
    });

    const pendingOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
        status: OrderStatus.PENDING,
      },
    });

    const cancelledOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
        status: OrderStatus.CANCELLED,
      },
    });

    const confirmedOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
        status: OrderStatus.CONFIRMED,
      },
    });

    const packedOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
        status: OrderStatus.PACKED,
      },
    });

    const shippedOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
        status: OrderStatus.SHIPPED,
      },
    });

    const deliveredOrders = await this.prisma.order.count({
      where: {
        customer_id: user.customerId,
        status: OrderStatus.DELIVERED,
      },
    });

    const recentOrders = await this.prisma.order.findMany({
      where: {
        customer_id: user.customerId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 5,
      include: {
        orderItems: true,
      },
    });

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders,
    };
  }
}
