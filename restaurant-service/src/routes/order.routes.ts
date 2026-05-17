import { Router } from 'express';
import { placeOrder, getRestaurantOrders, updateOrderStatus, getMyOrders, getReadyOrders, acceptDelivery, completeDelivery, getMyDeliveries } from '../controllers/order.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, authorize('CUSTOMER'), placeOrder);
router.get('/my-orders', protect, authorize('CUSTOMER'), getMyOrders);
router.get('/my-deliveries', protect, authorize('RIDER'), getMyDeliveries);
router.get('/ready', protect, authorize('RIDER'), getReadyOrders);
router.get('/restaurant-orders', protect, authorize('RESTAURANT'), getRestaurantOrders);
router.patch('/:id/status', protect, authorize('RESTAURANT'), updateOrderStatus);
router.patch('/:id/accept', protect, authorize('RIDER'), acceptDelivery);
router.patch('/:id/complete', protect, authorize('RIDER'), completeDelivery);

export default router;