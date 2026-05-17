import { Router } from 'express';
import { addMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, authorize('RESTAURANT'), addMenuItem);
router.patch('/:id', protect, authorize('RESTAURANT'), updateMenuItem);
router.delete('/:id', protect, authorize('RESTAURANT'), deleteMenuItem);

export default router;