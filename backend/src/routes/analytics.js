import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Get overall statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalTeachers,
      totalClasses,
      totalTimeBlocks,
      totalEnrollments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.timeBlock.count(),
      prisma.enrollment.count(),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalTeachers,
        totalClasses,
        totalTimeBlocks,
        totalEnrollments,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get time blocks by type
router.get('/timeblocks/by-type', async (req, res) => {
  try {
    const timeBlocks = await prisma.timeBlock.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    res.json({ data: timeBlocks });
  } catch (error) {
    console.error('Get timeblocks by type error:', error);
    res.status(500).json({ error: 'Failed to get timeblocks by type' });
  }
});

// Get user registrations over time
router.get('/users/registrations', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        createdAt: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyData = users.reduce((acc, user) => {
      const month = new Date(user.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = { month, students: 0, admins: 0, total: 0 };
      }
      
      acc[month].total++;
      if (user.role === 'STUDENT') {
        acc[month].students++;
      } else {
        acc[month].admins++;
      }
      
      return acc;
    }, {});

    res.json({ data: Object.values(monthlyData) });
  } catch (error) {
    console.error('Get user registrations error:', error);
    res.status(500).json({ error: 'Failed to get user registrations' });
  }
});

// Get class enrollment statistics
router.get('/classes/enrollment-stats', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        name: true,
        code: true,
        capacity: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const data = classes.map(cls => ({
      name: cls.name,
      code: cls.code,
      enrolled: cls._count.enrollments,
      capacity: cls.capacity || 0,
      available: cls.capacity ? cls.capacity - cls._count.enrollments : 0,
    }));

    res.json({ data });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({ error: 'Failed to get enrollment statistics' });
  }
});

// Get activity timeline
router.get('/activity/timeline', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        type: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyData = timeBlocks.reduce((acc, block) => {
      const day = new Date(block.createdAt).toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
      
      if (!acc[day]) {
        acc[day] = { day, class: 0, activity: 0, exam: 0, study: 0, other: 0, total: 0 };
      }
      
      acc[day][block.type] = (acc[day][block.type] || 0) + 1;
      acc[day].total++;
      
      return acc;
    }, {});

    res.json({ data: Object.values(dailyData) });
  } catch (error) {
    console.error('Get activity timeline error:', error);
    res.status(500).json({ error: 'Failed to get activity timeline' });
  }
});

// Get student activity summary
router.get('/students/activity-summary', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        username: true,
        personalInfo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            timeBlocks: true,
            enrollments: true,
          },
        },
      },
      take: 10,
      orderBy: {
        timeBlocks: {
          _count: 'desc',
        },
      },
    });

    const data = students.map(student => ({
      name: student.personalInfo 
        ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
        : student.username,
      username: student.username,
      activities: student._count.timeBlocks,
      enrollments: student._count.enrollments,
    }));

    res.json({ data });
  } catch (error) {
    console.error('Get student activity summary error:', error);
    res.status(500).json({ error: 'Failed to get student activity summary' });
  }
});

export default router;
