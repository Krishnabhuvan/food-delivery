import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import axios from 'axios';

const verifyRestaurantSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID')
});

const suspendUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200)
});

export const verifyRestaurant = async (req: Request, res: Response) => {
  try {
    const parsed = verifyRestaurantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { restaurantId } = parsed.data;

    // Call restaurant service directly via HTTP
    await axios.patch(
      `${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}/verify`,
      {},
      { headers: { Authorization: req.headers.authorization } }
    );

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'VERIFY_RESTAURANT',
        targetId: restaurantId,
        targetType: 'RESTAURANT'
      }
    });

    res.json({ message: 'Restaurant verified successfully', restaurantId });
  } catch (err) {
    console.error('VERIFY RESTAURANT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const suspendUser = async (req: Request, res: Response) => {
  try {
    const parsed = suspendUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { userId, reason } = parsed.data;

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'SUSPEND_USER',
        targetId: userId,
        targetType: 'USER'
      }
    });

    res.json({ message: 'User suspended', userId, reason });
  } catch (err) {
    console.error('SUSPEND USER ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    await axios.delete(`${process.env.RESTAURANT_SERVICE_URL}/internal/restaurants/${id}`);

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'DELETE_RESTAURANT',
        targetId: String(id),
        targetType: 'RESTAURANT'
      }
    });

    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    console.error('DELETE RESTAURANT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};