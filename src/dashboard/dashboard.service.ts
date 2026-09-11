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
  async getSalesAnalytics(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.order_date = {};

      if (startDate) {
        where.order_date.gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.order_date.lte = end;
      }
    }

    const [totalOrders, revenue, ordersByStatus, salesOverTime] =
      await Promise.all([
        this.prisma.order.count({
          where,
        }),

        this.prisma.order.aggregate({
          where,
          _sum: {
            total_amount: true,
          },
        }),

        this.prisma.order.groupBy({
          by: ['status'],
          where,
          _count: {
            order_id: true,
          },
        }),

        this.prisma.order.groupBy({
          by: ['order_date'],
          where,
          _sum: {
            total_amount: true,
          },
          _count: {
            order_id: true,
          },
          orderBy: {
            order_date: 'asc',
          },
        }),
      ]);

    return {
      totalRevenue: revenue._sum.total_amount ?? 0,
      totalOrders,

      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.order_id,
      })),

      salesOverTime: salesOverTime.map((item) => ({
        date: item.order_date,
        revenue: item._sum.total_amount ?? 0,
        orders: item._count.order_id,
      })),
    };
  }
  async getTopProducts(limit = 5) {
    const groupedProducts = await this.prisma.orderItem.groupBy({
      by: ['product_id'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: {
        order_item_id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const products = await this.prisma.product.findMany({
      where: {
        product_id: {
          in: groupedProducts.map((item) => item.product_id),
        },
      },
      select: {
        product_id: true,
        product_name: true,
        sku: true,
        unit_price: true,
        stock_quantity: true,
      },
    });

    return groupedProducts.map((item) => {
      const product = products.find(
        (product) => product.product_id === item.product_id,
      );

      return {
        productId: item.product_id,
        productName: product?.product_name,
        sku: product?.sku,
        unitPrice: product?.unit_price,
        stockQuantity: product?.stock_quantity,
        quantitySold: item._sum.quantity ?? 0,
        revenue: item._sum.subtotal ?? 0,
        orderCount: item._count.order_item_id,
      };
    });
  }

  async getLowStockProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        stock_quantity: {
          lte: 20,
        },
        status: 'ACTIVE',
      },
      select: {
        product_id: true,
        product_name: true,
        sku: true,
        unit_price: true,
        stock_quantity: true,
        category: {
          select: {
            category_id: true,
            category_name: true,
          },
        },
      },
      orderBy: {
        stock_quantity: 'asc',
      },
    });

    return products.map((product) => ({
      productId: product.product_id,
      productName: product.product_name,
      sku: product.sku,
      unitPrice: product.unit_price,
      stockQuantity: product.stock_quantity,
      category: product.category,
      stockStatus: product.stock_quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    }));
  }

  async getCustomerAnalytics(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};

      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    const [totalCustomers, filteredCustomers, recentCustomers] =
      await Promise.all([
        // Total customers in the whole system
        this.prisma.customer.count(),

        // Customers created within the selected period
        this.prisma.customer.findMany({
          where,
          select: {
            customer_id: true,
            business_name: true,
            business_location: true,
            contact_person: true,
            status: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'asc',
          },
        }),

        // Most recently registered customers
        this.prisma.customer.findMany({
          take: 5,
          select: {
            customer_id: true,
            business_name: true,
            contact_person: true,
            status: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
      ]);

    return {
      totalCustomers,
      newCustomers: filteredCustomers.length,

      newCustomersOverTime: filteredCustomers.map((customer) => ({
        customerId: customer.customer_id,
        businessName: customer.business_name,
        businessLocation: customer.business_location,
        contactPerson: customer.contact_person,
        status: customer.status,
        createdAt: customer.created_at,
      })),

      recentCustomers,
    };
  }

  async getRecentOrders(limit = 5) {
    const recentOrders = await this.prisma.order.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        customer: {
          select: {
            customer_id: true,
            business_name: true,
            contact_person: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
            subtotal: true,
            product: {
              select: {
                product_id: true,
                product_name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return recentOrders.map((order) => ({
      orderId: order.order_id,
      orderDate: order.order_date,
      status: order.status,
      totalAmount: order.total_amount,
      customer: order.customer,
      itemCount: order.orderItems.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      items: order.orderItems,
    }));
  }
}
