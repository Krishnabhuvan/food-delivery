import { OrderItemDto, OrderStatus } from './order.types';

export interface OrderPlacedEvent {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  items: OrderItemDto[];
  address: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  customerId: string;
  status: OrderStatus;
  timestamp: string;
}

export interface RiderAssignedEvent {
  orderId: string;
  riderId: string;
  customerId: string;
}