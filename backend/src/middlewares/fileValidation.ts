import { Request, Response, NextFunction } from 'express';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    });
  }

  next();
};
