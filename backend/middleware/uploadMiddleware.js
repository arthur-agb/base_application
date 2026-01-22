// middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate a secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    cb(null, `${randomName}${fileExt}`);
  }
});

// Define file filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and common document formats are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Handle multer errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400);
      throw new Error(`File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024) / (1024 * 1024)}MB`);
    }
    res.status(400);
    throw new Error(err.message);
  } else if (err) {
    res.status(400);
    throw new Error(err.message);
  }
  next();
};

export {
  upload,
  handleUploadErrors
};
