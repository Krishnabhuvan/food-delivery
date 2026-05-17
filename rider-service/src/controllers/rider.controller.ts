import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15)
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

const updateDeliveryStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'PICKED_UP', 'DELIVERED'] as const)
});

export const createProfile = async (req: Request, res: Response) => {
  try {
    const parsed = createProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name, phone } = parsed.data;
    const userId = req.user!.id;

    const existing = await prisma.rider.findUnique({ where: { userId } });
    if (existing) return res.status(409).json({ message: 'Rider profile already exists' });

    const rider = await prisma.rider.create({
      data: { userId, name, phone }
    });
    res.status(201).json(rider);
  } catch (err) {
    console.error('CREATE PROFILE ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user!.id },
      include: { deliveries: true }
    });
    if (!rider) return res.status(404).json({ message: 'Rider not found' });
    res.json(rider);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
    if (!rider) return res.status(404).json({ message: 'Rider not found' });

    const updated = await prisma.rider.update({
      where: { userId: req.user!.id },
      data: { isAvailable: !rider.isAvailable }
    });
    res.json({ isAvailable: updated.isAvailable });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const parsed = updateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { latitude, longitude } = parsed.data;

    const rider = await prisma.rider.update({
      where: { userId: req.user!.id },
      data: { latitude, longitude }
    });
    res.json({ latitude: rider.latitude, longitude: rider.longitude });
  } catch (err) {
    console.error('UPDATE LOCATION ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
    if (!rider) return res.status(404).json({ message: 'Rider not found' });

    const existing = await prisma.delivery.findUnique({ where: { orderId } });
    if (existing) return res.status(409).json({ message: 'Order already assigned' });

    const delivery = await prisma.delivery.create({
      data: { riderId: rider.id, orderId, status: 'ASSIGNED' }
    });

    await prisma.rider.update({
      where: { id: rider.id },
      data: { isAvailable: false }
    });

    res.status(201).json(delivery);
  } catch (err) {
    console.error('ACCEPT DELIVERY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const parsed = updateDeliveryStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const id = req.params['id'] as string;
    const { status } = parsed.data;

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        status,
        ...(status === 'PICKED_UP' && { pickedUpAt: new Date() }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() })
      }
    });

    if (status === 'DELIVERED') {
      await prisma.rider.update({
        where: { id: delivery.riderId },
        data: { isAvailable: true }
      });
    }

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAvailableRiders = async (req: Request, res: Response) => {
  try {
    const riders = await prisma.rider.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true, phone: true, latitude: true, longitude: true }
    });
    res.json(riders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};