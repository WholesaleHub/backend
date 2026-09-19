import { Injectable, InternalServerErrorException, } from '@nestjs/common';
import sharp from 'sharp';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class ImageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    try {
      const processedBuffer = await sharp(file.buffer)
        .resize(800, 800, {
          fit: 'cover',
        })
        .jpeg({
          quality: 85,
        })
        .toBuffer();

      const result = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              asset_folder: 'wholesalehub/products',
              resource_type: 'image',
              format: 'jpg',
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(
                  new Error('Cloudinary did not return an upload result'),
                );
              }

              resolve(result);
            },
          );

          uploadStream.end(processedBuffer);
        },
      );

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);

      throw new InternalServerErrorException(
        'Failed to upload product image',
      );
    }
  }
  async deleteProductImage(imageUrl: string | null): Promise<void> {
    if (!imageUrl) {
      return;
    }

    // Old images saved using Render/local storage
    if (imageUrl.startsWith('/uploads/products/')) {
      return;
    }

    if (!imageUrl.includes('res.cloudinary.com')) {
      return;
    }

    try {
      const publicId = this.extractCloudinaryPublicId(imageUrl);

      if (!publicId) {
        return;
      }

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete Cloudinary image:', error);
    }
  }

  private extractCloudinaryPublicId(imageUrl: string): string | null {
    try {
      const url = new URL(imageUrl);

      const uploadIndex = url.pathname.indexOf('/upload/');

      if (uploadIndex === -1) {
        return null;
      }

      let publicId = url.pathname.substring(
        uploadIndex + '/upload/'.length,
      );

      // Remove Cloudinary version, e.g. v1723456789/
      publicId = publicId.replace(/^v\d+\//, '');

      // Remove extension
      publicId = publicId.replace(/\.[^/.]+$/, '');

      return publicId;
    } catch {
      return null;
    }
  }
}
