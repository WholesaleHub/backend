import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { UserQueryDto } from './dto/user-query.dto';
  import { UpdateUserStatusDto } from './dto/update-user-status.dto';
  
  @Controller('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Get()
    findAll(@Query() query: UserQueryDto) {
      return this.usersService.findAll(
        query.search,
        query.role,
        query.status,
      );
    }
  
    @Patch(':id/status')
    updateStatus(
      @Param('id') id: string,
      @Body() dto: UpdateUserStatusDto,
      @Req() req,
    ) {
        return this.usersService.updateStatus(
        id,
        dto.status,
        req.user.userId,
      );
    }
  }