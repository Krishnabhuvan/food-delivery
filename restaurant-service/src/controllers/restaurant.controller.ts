import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  address: z.string().min(3, 'Address must be at least 3 characters').max(200),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15)
});

export const createRestaurant = async (req: Request, res: Response) => {
  try {
    const parsed = createRestaurantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name, description, address, phone } = parsed.data;
    const ownerId = (req as any).user.id;

    const existing = await prisma.restaurant.findUnique({ where: { ownerId } });
    if (existing) return res.status(409).json({ message: 'Restaurant already exists for this account' });

    const restaurant = await prisma.restaurant.create({
      data: { ownerId, name, description, address, phone, isVerified: false, isOpen: false }
    });

    await redis.del('restaurants:all');
    res.status(201).json(restaurant);
  } catch (err) {
    console.error('CREATE RESTAURANT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRestaurant = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const { name, description, address, phone, imageUrl } = req.body;

    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const updated = await prisma.restaurant.update({
      where: { ownerId },
      data: {
  ...(name && { name }),
  ...(description && { description }),
  ...(address && { address }),
  ...(phone && { phone }),
  ...(imageUrl && { imageUrl })
}
    });

    await redis.del('restaurants:all');
    res.json(updated);
  } catch (err) {
    console.error('UPDATE RESTAURANT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: (req as any).user.id },
      include: { menuItems: true }
    });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    if (!search) {
      const cached = await redis.get('restaurants:all');
      if (cached) {
        console.log('Cache hit: restaurants:all');
        return res.json(JSON.parse(cached));
      }
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        isVerified: true,
        isOpen: true,
        ...(search && { name: { contains: search as string, mode: 'insensitive' } })
      },
      include: { menuItems: { where: { isAvailable: true } } }
    });

    if (!search) {
      await redis.set('restaurants:all', JSON.stringify(restaurants), { EX: 60 });
      console.log('Cache set: restaurants:all');
    }

    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllRestaurantsAdmin = async (req: Request, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: { menuItems: { where: { isAvailable: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleOpen = async (req: Request, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: (req as any).user.id }
    });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { isOpen: !restaurant.isOpen }
    });

    await redis.del('restaurants:all');
    res.json({ isOpen: updated.isOpen });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyRestaurantById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params['id']);
    const updated = await prisma.restaurant.update({
      where: { id },
      data: { isVerified: true, isOpen: true }
    });

    await redis.del('restaurants:all');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReadyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'READY' },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
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
      data: { status: 'PICKED_UP', riderId }
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
      data: { status: 'DELIVERED' }
    });
    res.json(order);
  } catch (err) {
    console.error('COMPLETE DELIVERY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRestaurantById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params['id']);

    // Delete related records first
    await prisma.orderItem.deleteMany({
      where: { menuItem: { restaurantId: id } }
    });
    await prisma.menuItem.deleteMany({ where: { restaurantId: id } });
    await prisma.order.deleteMany({ where: { restaurantId: id } });
    await prisma.restaurant.delete({ where: { id } });

    await redis.del('restaurants:all');
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    console.error('DELETE RESTAURANT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};