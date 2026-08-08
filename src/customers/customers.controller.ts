import { Controller, Post, Get, Patch, Param } from '@nestjs/common';

@Controller('customers')
export class CustomersController {
    @Post()
    create(){
        return 'Create customer';
    }

    @Get()
    findAll(){
        return 'Find all customers';
    }

    @Get(':id')
    findOne(){
        
    }

    @Get('me')
    findMe(){
        return 'Current customer';
    }

    @Patch('me')
    updateMe(){
        return 'Update current customer';
    }

    @Patch(':id/status')
    changeStatus(){}
}
