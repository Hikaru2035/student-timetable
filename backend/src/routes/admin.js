import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { invokeNotificationLambda } from '../services/notificationLambda.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// ==================== USERS/STUDENTS ====================

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        personalInfo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            studentId: true,
          },
        },
        _count: {
          select: {
            timeBlocks: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// Send notifications through Lambda
router.post('/notifications/send', async (req, res) => {
  try {
    const { channel, message, subject, roles, userIds } = req.body;

    if (!channel || !message) {
      return res.status(400).json({ error: 'channel and message are required' });
    }

    if (!['sms', 'email'].includes(channel)) {
      return res.status(400).json({ error: 'channel must be sms or email' });
    }

    const result = await invokeNotificationLambda({
      channel,
      message,
      subject,
      roles,
      userIds,
      requestedBy: req.userId,
    });

    res.json({ result });
  } catch (error) {
    console.error('Send notifications error:', error);
    res.status(500).json({ error: error.message || 'Failed to send notifications' });
  }
});

// ==================== TEACHERS ====================

router.get('/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to get teachers' });
  }
});

// Create teacher
router.post('/teachers', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, subject } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const teacher = await prisma.teacher.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        department,
        subject,
      },
    });

    res.status(201).json({ teacher });
  } catch (error) {
    console.error('Create teacher error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Update teacher
router.put('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, department, subject } = req.body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        department,
        subject,
      },
    });

    res.json({ teacher });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Delete teacher
router.delete('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teacher.delete({
      where: { id },
    });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// ==================== CLASSES ====================

router.get('/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        teacher: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Create class
router.post('/classes', async (req, res) => {
  try {
    const { name, code, description, schedule, room, capacity, teacherId, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const classData = await prisma.class.create({
      data: {
        name,
        code,
        description,
        schedule,
        room,
        capacity: capacity ? parseInt(capacity) : null,
        teacherId,
        status: status || 'ACTIVE',
      },
      include: {
        teacher: true,
      },
    });

    res.status(201).json({ class: classData });
  } catch (error) {
    console.error('Create class error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Class code already exists' });
    }
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update class
router.put('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, schedule, room, capacity, teacherId, status } = req.body;

    const classData = await prisma.class.update({
      where: { id },
      data: {
        name,
        code,
        description,
        schedule,
        room,
        capacity: capacity ? parseInt(capacity) : null,
        teacherId,
        status,
      },
      include: {
        teacher: true,
      },
    });

    res.json({ class: classData });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete class
router.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.class.delete({
      where: { id },
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// ==================== ENROLLMENTS ====================

router.post('/enrollments', async (req, res) => {
  try {
    const { userId, classId } = req.body;

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        classId,
      },
      include: {
        user: {
          select: {
            username: true,
            personalInfo: true,
          },
        },
        class: true,
      },
    });

    res.status(201).json({ enrollment });
  } catch (error) {
    console.error('Create enrollment error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Student already enrolled in this class' });
    }
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// Remove enrollment
router.delete('/enrollments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.enrollment.delete({
      where: { id },
    });

    res.json({ message: 'Enrollment removed successfully' });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ error: 'Failed to remove enrollment' });
  }
});

// Get enrollments for a class
router.get('/classes/:id/enrollments', async (req, res) => {
  try {
    const { id } = req.params;

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            personalInfo: true,
          },
        },
      },
    });

    res.json({ enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
});

export default router;
