import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads/products',

    filename: (req, file, callback) => {
      const filename = `${randomUUID()}${extname(file.originalname)}`;
      callback(null, filename);
    },
  }),

  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },

  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error('Only JPG, PNG and WEBP images are allowed'),
        false,
      );
    }

    callback(null, true);
  },
};
