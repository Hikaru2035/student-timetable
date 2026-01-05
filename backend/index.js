// server.js
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", async (req,res) => {
  const { name, deadline, status } = req.body;
  try {
    const post = await prisma.task.create({
      data: { name, deadline: new Date(deadline), status}
    })
    res.status(201).json(post);
  } catch(error){
    res.status(500).json(error.message);
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { name, deadline, status } = req.body;

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        name,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
      },
    });
    res.json(task);

  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array' });
  }

  try {
    await prisma.task.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    res.json({ message: 'Deleted successfully', deletedIds: ids });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, '0.0.0.0', () => console.log('API running on 3000'));