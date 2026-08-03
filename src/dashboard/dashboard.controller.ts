import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
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
}
