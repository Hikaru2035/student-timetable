// test-db.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

await prisma.task.create({
  data: {
    name: 'Test Prisma',
    deadline: new Date('2026-04-22'),
    status: 'Done',
  },
})

app.post('/post', async (req, res) => {
  console.log('BODY:', req.body);

  const { name, deadline, status } = req.body;

  if (!name || !deadline || !status) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const date = new Date(deadline);
  if (isNaN(date)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  try {
    const task = await prisma.task.create({
      data: {
        name,
        deadline: date,
        status,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});
