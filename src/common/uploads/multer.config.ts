import { memoryStorage } from 'multer';

export const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },

  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error('Only JPG, PNG and WEBP images are allowed'),
        false,
      );
    }

    callback(null, true);
  },
};