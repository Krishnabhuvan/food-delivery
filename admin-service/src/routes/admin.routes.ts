import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { verifyRestaurant, suspendUser, getLogs } from '../controllers/admin.controller';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/verify-restaurant', verifyRestaurant);
router.post('/suspend-user', suspendUser);
router.get('/logs', getLogs);

export default router;