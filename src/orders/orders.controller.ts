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
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { CreateOrderDto } from './dto/create-order.dto';
  import { UpdateOrderDto } from './dto/update-order.dto';
  import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { UserRole } from '../auth/dto/register.dto';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { RolesGuard } from '../auth/guards/roles.guard';
  
  @Controller('orders')
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}
  
    @Post()
    create(@Body() createOrderDto: CreateOrderDto, @Req() req,) {
      return this.ordersService.create(createOrderDto, req.user.user_id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-orders')
    findMyOrders(@Req() req) {
      return this.ordersService.findMyOrders(
        req.user.customerId,
      );
    }
  
    @Get()
    findAll() {
      return this.ordersService.findAll();
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