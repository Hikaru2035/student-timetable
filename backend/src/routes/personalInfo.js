import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check authentication
router.use(requireAuth);

// Get personal info
router.get('/', async (req, res) => {
  try {
    const personalInfo = await prisma.personalInfo.findUnique({
      where: { userId: req.userId },
    });

    res.json({ personalInfo });
  } catch (error) {
    console.error('Get personal info error:', error);
    res.status(500).json({ error: 'Failed to get personal info' });
  }
});

// Create or update personal info
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      studentId,
      dateOfBirth,
      address,
      emergencyContact,
      emergencyPhone,
    } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check if personal info already exists
    const existing = await prisma.personalInfo.findUnique({
      where: { userId: req.userId },
    });

    let personalInfo;

    if (existing) {
      // Update existing
      personalInfo = await prisma.personalInfo.update({
        where: { userId: req.userId },
        data: {
          firstName,
          lastName,
          email,
          phone,
          studentId,
          dateOfBirth,
          address,
          emergencyContact,
          emergencyPhone,
        },
      });
    } else {
      // Create new
      personalInfo = await prisma.personalInfo.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          studentId,
          dateOfBirth,
          address,
          emergencyContact,
          emergencyPhone,
          userId: req.userId,
        },
      });
    }

    res.json({ personalInfo });
  } catch (error) {
    console.error('Save personal info error:', error);
    res.status(500).json({ error: 'Failed to save personal info' });
  }
});

export default router;