import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async create(createCategoryDto: CreateCategoryDto) {
        return this.prisma.category.create({
          data: createCategoryDto,
        });
      }

    async findAll() {
        return this.prisma.category.findMany();
      }
    async findOne(category_id: number) {
        return this.prisma.category.findUnique({
          where: {
            category_id,
          },
        });
      }

    async update(category_id: number, updateCategoryDto: UpdateCategoryDto) {
        return this.prisma.category.update({
          where: {
            category_id,
          },
          data: updateCategoryDto,
        });
      }
    
      async remove(category_id: number) {
        return this.prisma.category.delete({
          where: {
            category_id,
          },
        });
      }
}
