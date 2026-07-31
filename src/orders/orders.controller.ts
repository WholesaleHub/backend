import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { CreateOrderDto } from './dto/create-order.dto';
  import { UpdateOrderDto } from './dto/update-order.dto';
  import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { UserRole } from 'src/auth/dto/register.dto';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  
  @Controller('orders')
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}
  
    @Post()
    create(@Body() createOrderDto: CreateOrderDto) {
      return this.ordersService.create(createOrderDto);
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