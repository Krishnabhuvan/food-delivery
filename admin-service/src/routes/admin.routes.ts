import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { verifyRestaurant, suspendUser, getLogs, deleteRestaurant } from '../controllers/admin.controller';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/verify-restaurant', verifyRestaurant);
router.post('/suspend-user', suspendUser);
router.get('/logs', getLogs);
router.delete('/restaurants/:id', deleteRestaurant);

export default router;