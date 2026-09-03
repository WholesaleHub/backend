import {
    Controller,
    Get,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { AuditService } from './audit.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { AuditQueryDto } from './dto/audit-query.dto';
  
  @Controller('audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  export class AuditController {
    constructor(private readonly auditService: AuditService) {}
  
    @Get()
    findAll(@Query() query: AuditQueryDto) {
      return this.auditService.findAll(
        query.page,
        query.limit,
        query.action,
      );
    }
  }