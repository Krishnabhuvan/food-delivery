import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const addMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user!.id } });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    const item = await prisma.menuItem.create({
      data: { restaurantId: restaurant.id, name, description, price, category, imageUrl: imageUrl || null }
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('ADD MENU ITEM ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const item = await prisma.menuItem.update({
      where: { id },
      data: req.body
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};