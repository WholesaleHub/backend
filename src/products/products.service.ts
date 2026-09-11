import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-products.dto';
import { ImageService } from '../common/images/image.service';
import { extname, join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ImageService,
  ) {}
  private getStockStatus(stock: number): string {
    if (stock === 0) {
      return 'OUT_OF_STOCK';
    }

    if (stock <= 20) {
      return 'LOW_STOCK';
    }

    return 'IN_STOCK';
  }

  private async processProductImage(
    file: Express.Multer.File,
  ): Promise<string> {
    const extension = extname(file.path).toLowerCase();

    const temporaryPath =
      file.path.replace(extname(file.path), '') + `.tmp${extension}`;

    await this.imageService.resizeProductImage(file.path, temporaryPath);

    await fs.unlink(file.path);
    await fs.rename(temporaryPath, file.path);

    return `/uploads/products/${file.filename}`;
  }

  private async deleteProductImage(imageUrl: string | null): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/uploads/products/')) {
      return;
    }

    const relativePath = imageUrl.replace(/^\/+/, '');
    const absolutePath = join(process.cwd(), relativePath);

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const fileError = error as NodeJS.ErrnoException;

      if (fileError.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  async create(createProductDto: CreateProductDto, file?: Express.Multer.File) {
    const category = await this.prisma.category.findUnique({
      where: {
        category_id: createProductDto.category_id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const image_url = file ? await this.processProductImage(file) : null;

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        image_url,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(query: QueryProductDto) {
    const { search, category, availability, minPrice, maxPrice, page, limit } =
      query;

    const currentPage = page ?? 1;
    const currentLimit = limit ?? 10;

    const skip = (currentPage - 1) * currentLimit;

    const where: any = {};
    if (search) {
      where.product_name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.category_id = category;
    }

    if (availability === 'OUT_OF_STOCK') {
      where.stock_quantity = 0;
    }

    if (availability === 'LOW_STOCK') {
      where.stock_quantity = {
        gt: 0,
        lte: 20,
      };
    }

    if (availability === 'IN_STOCK') {
      where.stock_quantity = {
        gt: 20,
      };
    }
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException(
        'Minimum price cannot be greater than maximum price',
      );
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.unit_price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }
    const total = await this.prisma.product.count({
      where,
    });
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      skip,
      take: currentLimit,
    });
    return {
      data: products.map((product) => ({
        ...product,
        stock_status: this.getStockStatus(product.stock_quantity),
      })),

      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  async findOne(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: { product_id },
      include: {
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return {
      ...product,
      stock_status: this.getStockStatus(product.stock_quantity),
    };
  }

  async update(
    product_id: number,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ) {
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        product_id,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (
      updateProductDto.stock_quantity !== undefined &&
      updateProductDto.stock_quantity < 0
    ) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    if (updateProductDto.category_id !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: {
          category_id: updateProductDto.category_id,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const { remove_image, ...productData } = updateProductDto;

    let nextImageUrl: string | null | undefined;

    if (file) {
      nextImageUrl = await this.processProductImage(file);
    } else if (remove_image === true) {
      nextImageUrl = null;
    }

    const updatedProduct = await this.prisma.product.update({
      where: {
        product_id,
      },
      data: {
        ...productData,
        ...(nextImageUrl !== undefined ? { image_url: nextImageUrl } : {}),
      },
      include: {
        category: true,
      },
    });

    const imageWasChanged = file !== undefined || remove_image === true;

    if (
      imageWasChanged &&
      existingProduct.image_url &&
      existingProduct.image_url !== updatedProduct.image_url
    ) {
      await this.deleteProductImage(existingProduct.image_url);
    }

    return {
      ...updatedProduct,
      stock_status: this.getStockStatus(updatedProduct.stock_quantity),
    };
  }

  async remove(product_id: number) {
    return this.prisma.product.delete({
      where: {
        product_id,
      },
    });
  }
}
