import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check authentication
router.use(requireAuth);

// Get all time blocks for current user
router.get('/', async (req, res) => {
  try {
    const timeBlocks = await prisma.timeBlock.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'asc' },
    });

    res.json({ timeBlocks });
  } catch (error) {
    console.error('Get time blocks error:', error);
    res.status(500).json({ error: 'Failed to get time blocks' });
  }
});

// Get time blocks by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ timeBlocks });
  } catch (error) {
    console.error('Get time blocks by range error:', error);
    res.status(500).json({ error: 'Failed to get time blocks' });
  }
});

// Create time block
router.post('/', async (req, res) => {
  try {
    const { title, type, date, startTime, endTime, location, description, color } = req.body;

    if (!title || !type || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timeBlock = await prisma.timeBlock.create({
      data: {
        title,
        type,
        date,
        startTime,
        endTime,
        location,
        description,
        color,
        userId: req.userId,
      },
    });

    res.status(201).json({ timeBlock });
  } catch (error) {
    console.error('Create time block error:', error);
    res.status(500).json({ error: 'Failed to create time block' });
  }
});

// Update time block
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, date, startTime, endTime, location, description, color } = req.body;

    // Check if time block belongs to user
    const existingBlock = await prisma.timeBlock.findUnique({
      where: { id },
    });

    if (!existingBlock || existingBlock.userId !== req.userId) {
      return res.status(404).json({ error: 'Time block not found' });
    }

    const timeBlock = await prisma.timeBlock.update({
      where: { id },
      data: {
        title,
        type,
        date,
        startTime,
        endTime,
        location,
        description,
        color,
      },
    });

    res.json({ timeBlock });
  } catch (error) {
    console.error('Update time block error:', error);
    res.status(500).json({ error: 'Failed to update time block' });
  }
});

// Delete time block
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if time block belongs to user
    const existingBlock = await prisma.timeBlock.findUnique({
      where: { id },
    });

    if (!existingBlock || existingBlock.userId !== req.userId) {
      return res.status(404).json({ error: 'Time block not found' });
    }

    await prisma.timeBlock.delete({
      where: { id },
    });

    res.json({ message: 'Time block deleted successfully' });
  } catch (error) {
    console.error('Delete time block error:', error);
    res.status(500).json({ error: 'Failed to delete time block' });
  }
});

export default router;