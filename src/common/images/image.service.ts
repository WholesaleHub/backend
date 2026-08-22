import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async resizeProductImage(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    await sharp(inputPath)
      .resize(800, 800, {
        fit: 'cover',
      })
      .jpeg({
        quality: 85,
      })
      .toFile(outputPath);
  }
}
