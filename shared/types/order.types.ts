export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemDto {
  menuItemId: string;
  quantity: number;
  price: number;
}

export interface PlaceOrderDto {
  restaurantId: string;
  items: OrderItemDto[];
  address: string;
}