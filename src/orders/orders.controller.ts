import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    Req,
    Query,    
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { CreateOrderDto } from './dto/create-order.dto';
  import { UpdateOrderDto } from './dto/update-order.dto';
  import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { UserRole } from '../auth/dto/register.dto';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { OrderStatus } from '@prisma/client';
  
  @Controller('orders')
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.RETAILER)
    create(@Body() dto: CreateOrderDto, @Req() req,) {
      return this.ordersService.create(dto, req.user,);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-orders')
    findMyOrders(@Req() req) {
      return this.ordersService.findMyOrders(
        req.user.customerId,
      );
    }

    @Roles(UserRole.ADMIN, UserRole.WHOLESALER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    findAllOrders(
    @Query('status') status?: OrderStatus,
    @Query('customer') customer?: string,
    @Query('sort') sort?: 'asc' | 'desc',
    ) {
  return this.ordersService.findAllOrders(
    status,
    customer,
    sort,
  );
}  
   
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.ordersService.findOne(+id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(
      @Param('id') id: string,
      @Body() updateOrderDto: UpdateOrderDto,
    ) {
      return this.ordersService.update(+id, updateOrderDto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.WHOLESALER)
    updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(+id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.ordersService.remove(+id);
    }
  }