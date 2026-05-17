import { Router } from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/upload.controller';
import { protect } from '../middleware/auth.middleware';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

const router = Router();

router.post('/', protect, upload.single('image'), uploadImage);
router.delete('/', protect, deleteImage);

export default router;