import { Controller, Post, Get, Patch, Param, Body, Req,UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/register.dto';

@Controller('customers')
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
    ){}

    @Post()
    create(){
        return 'Create customer';
    }

    @Get()
    findAll(){
        return 'Find all customers';
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMe(@Req() req){
        return this.customersService.findMe(req.user.userId,);
    }

    // PATCH /customers/me
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateMe(@Req() req, @Body() dto: UpdateCustomerDto,){
        return this.customersService.update(
            req.user.userId,
            dto,
          );
    }
    // GET /customers/:id
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(+id);
    }

    @Patch(':id/status')
    changeStatus(){}
}
