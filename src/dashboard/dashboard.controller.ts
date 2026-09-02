import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/dto/register.dto';
import { DashboardService } from './dashboard.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/stats')
  getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('sales')
  getSalesAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.dashboardService.getSalesAnalytics(
      query.startDate,
      query.endDate,
    );
  }

  @Get('customer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RETAILER)
  getCustomerDashboard(@Req() req) {
    return this.dashboardService.getCustomerDashboard(req.user);
  }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('top-products')
  getTopProducts() {
    return this.dashboardService.getTopProducts();
  }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('low-stock')
  getLowStockProducts() {
    return this.dashboardService.getLowStockProducts();
  }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('customers')
  getCustomerAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.dashboardService.getCustomerAnalytics(
    query.startDate,
    query.endDate,
  );
}

@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('recent-orders')
getRecentOrders() {
  return this.dashboardService.getRecentOrders();
}
}
