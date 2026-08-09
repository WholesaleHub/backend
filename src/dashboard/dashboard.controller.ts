import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/dto/register.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
    ) {}

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

    @Get('customer')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.RETAILER)
    getCustomerDashboard(@Req() req) {
        return this.dashboardService.getCustomerDashboard(req.user);
    }
}
