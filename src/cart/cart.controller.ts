import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  
  import { CartService } from './cart.service';
  import { AddCartItemDto } from './dto/add-cart-item.dto';
  import { UpdateCartItemDto } from './dto/update-cart-item.dto';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { UserRole } from '../auth/dto/register.dto';
  
  @Controller('cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RETAILER)
  export class CartController {
    constructor(private readonly cartService: CartService) {}
  
    @Get()
    getCart(@Req() req) {
      return this.cartService.getCart(req.user.customerId);
    }
  
    @Post('items')
    addItem(@Req() req, @Body() dto: AddCartItemDto) {
      return this.cartService.addItem(req.user.customerId, dto);
    }
  
    @Patch('items/:id')
    updateItem(
      @Req() req,
      @Param('id') id: string,
      @Body() dto: UpdateCartItemDto,
    ) {
      return this.cartService.updateItem(
        req.user.customerId,
        +id,
        dto,
      );
    }
  
    @Delete('items/:id')
    removeItem(@Req() req, @Param('id') id: string) {
      return this.cartService.removeItem(
        req.user.customerId,
        +id,
      );
    }
  
    @Delete()
    clearCart(@Req() req) {
      return this.cartService.clearCart(req.user.customerId);
    }
  }