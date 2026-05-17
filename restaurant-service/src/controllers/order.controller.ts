import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { publish } from '../events/publisher';

const placeOrderSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  items: z.array(z.object({
    menuItemId: z.string().uuid('Invalid menu item ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1')
  })).min(1, 'Order must have at least one item')
});

const updateStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED'] as const)
});

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const parsed = placeOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { restaurantId, items, address } = parsed.data;
    const customerId = (req as any).user.id;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      totalAmount += menuItem.price * item.quantity;
      orderItems.push({ menuItemId: item.menuItemId, quantity: item.quantity, price: menuItem.price });
    }

    const order = await prisma.order.create({
      data: { customerId, restaurantId, address, totalAmount, items: { create: orderItems } },
      include: { items: true, restaurant: true }
    });

    await publish('order.placed', {
      orderId: order.id,
      customerId,
      restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      totalAmount,
      address,
      items: orderItems
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('PLACE ORDER ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: (req as any).user.id }
    });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { restaurantId: restaurant.id },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: { restaurantId: restaurant.id }
      })
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const id = String(req.params['id']);
    const { status } = parsed.data;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { restaurant: true }
    });

    await publish('order.status.changed', {
      orderId: id,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      status,
      timestamp: new Date().toISOString()
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: (req as any).user.id },
        include: { items: { include: { menuItem: true } }, restaurant: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: { customerId: (req as any).user.id }
      })
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReadyOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'READY' },
        include: { items: { include: { menuItem: true } }, restaurant: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { status: 'READY' } })
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptDelivery = async (req: Request, res: Response) => {
  try {
    const id = String(req.params['id']);
    const riderId = (req as any).user.id;

    const order = await prisma.order.update({
      where: { id },
      data: { status: 'PICKED_UP', riderId },
      include: { restaurant: true }
    });

    await publish('order.status.changed', {
      orderId: id,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      status: 'PICKED_UP',
      timestamp: new Date().toISOString()
    });

    await publish('rider.assigned', {
      orderId: id,
      riderId,
      customerId: order.customerId
    });

    res.json(order);
  } catch (err) {
    console.error('ACCEPT DELIVERY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const id = String(req.params['id']);
    const riderId = (req as any).user.id;

    const order = await prisma.order.update({
      where: { id, riderId },
      data: { status: 'DELIVERED' },
      include: { restaurant: true }
    });

    await publish('order.status.changed', {
      orderId: id,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      status: 'DELIVERED',
      timestamp: new Date().toISOString()
    });

    res.json(order);
  } catch (err) {
    console.error('COMPLETE DELIVERY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyDeliveries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const riderId = (req as any).user.id;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { riderId, status: { in: ['PICKED_UP', 'DELIVERED'] } },
        include: { items: { include: { menuItem: true } }, restaurant: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: { riderId, status: { in: ['PICKED_UP', 'DELIVERED'] } }
      })
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};