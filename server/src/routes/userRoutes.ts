import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  signup,
  getUserProfile,
  updateUserProfile,
  uploadCV,
  getCV
} from '../controllers/userController.js';

const router = Router();

// ─── Uploads directory ────────────────────────────────────────────────────────
// Use an absolute path so multer always knows where to write,
// regardless of the working directory Node was started from.
const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Multer storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR); // absolute path — never fails silently
  },
  filename: (_req, file, cb) => {
    // e.g. 1718000000000-MyCV.pdf
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const fileFilter = (_req: any, file: any, cb: any) => {
  console.log('[Multer] Checking file:', file.originalname, file.mimetype);
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Use PDF, DOCX, or TXT.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ─── Multer error handler ─────────────────────────────────────────────────────
// Wraps the multer middleware so its errors are returned as proper JSON
// instead of crashing the server with an HTML 500.
function uploadSingle(fieldName: string) {
  return (req: any, res: any, next: any) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/signup', signup);

router.get('/:userId/profile', getUserProfile);
router.patch('/:userId/profile', updateUserProfile);

// Use the wrapper so multer errors are JSON, not crashes
router.post('/:userId/cv/upload', uploadSingle('cv'), uploadCV);
router.get('/:userId/cv/download', getCV);

export default router;