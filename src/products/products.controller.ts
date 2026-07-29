import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
  } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-products.dto';
import { multerOptions } from '../common/uploads/multer.config';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('image', multerOptions),
      )  
    create(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 15 * 1024 * 1024, // 15 MB
                      }),
                  ],
                  fileIsRequired: false,
                }),
        ) file: Express.Multer.File,
        @Body() createProductDto: CreateProductDto,) 
        {
        return this.productsService.create(
            createProductDto,
            file,
        );
    }

    @Get()
    findAll(@Query() query: QueryProductDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(+id);
    }

    @Patch(':id')
    @UseInterceptors(
        FileInterceptor('image', multerOptions),
    )
    update(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 15 * 1024 * 1024,
                    }),
                ],
                fileIsRequired: false,
            }),
        )
        file: Express.Multer.File | undefined,
        @Body() updateProductDto: UpdateProductDto,
    ) {
    return this.productsService.update(
        +id,
        updateProductDto,
        file,
    );
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productsService.remove(+id);
    }
}
