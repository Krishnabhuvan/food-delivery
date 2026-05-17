import { Router } from 'express';
import {
  createProfile, getProfile, toggleAvailability,
  updateLocation, acceptDelivery, updateDeliveryStatus, getAvailableRiders
} from '../controllers/rider.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/profile', protect, authorize('RIDER'), createProfile);
router.get('/profile', protect, authorize('RIDER'), getProfile);
router.patch('/toggle-availability', protect, authorize('RIDER'), toggleAvailability);
router.patch('/location', protect, authorize('RIDER'), updateLocation);
router.post('/accept', protect, authorize('RIDER'), acceptDelivery);
router.patch('/delivery/:id/status', protect, authorize('RIDER'), updateDeliveryStatus);
router.get('/available', getAvailableRiders);

export default router;