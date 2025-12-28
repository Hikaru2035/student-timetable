// server.js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let tasks = [
  { id: '1', name: 'Design new landing page', deadline: '2025-12-28', status: 'todo' },
];

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask = { ...req.body, id: Date.now().toString() };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  tasks = tasks.map(t =>
    t.id === req.params.id ? { ...t, ...req.body } : t
  );
  res.json({ success: true });
});

app.delete('/api/tasks', (req, res) => {
  const { ids } = req.body;
  tasks = tasks.filter(t => !ids.includes(t.id));
  res.json({ success: true });
});

app.listen(3001, () => console.log('API running on 3001'));
