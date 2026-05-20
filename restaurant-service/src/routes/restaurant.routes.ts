import { Router } from 'express';
import { createRestaurant, updateRestaurant, getMyRestaurant, getAllRestaurants, getAllRestaurantsAdmin, toggleOpen, verifyRestaurantById } from '../controllers/restaurant.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllRestaurants);
router.post('/', protect, authorize('RESTAURANT'), createRestaurant);
router.get('/me', protect, authorize('RESTAURANT'), getMyRestaurant);
router.patch('/me', protect, authorize('RESTAURANT'), updateRestaurant);
router.get('/all', protect, authorize('ADMIN'), getAllRestaurantsAdmin);
router.patch('/toggle-open', protect, authorize('RESTAURANT'), toggleOpen);
router.patch('/:id/verify', protect, authorize('ADMIN'), verifyRestaurantById);

export default router;