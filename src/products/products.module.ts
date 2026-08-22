import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ImageModule } from '../common/images/image.module';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule, ImageModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
