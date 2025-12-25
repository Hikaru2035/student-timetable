const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let todos = [];
let id = 1;

/**
 * GET all tasks
 */
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

/**
 * ADD task
 */
app.post("/api/todos", (req, res) => {
  const { task, deadline, status } = req.body;

  if (!task || !deadline) {
    return res.status(400).json({ message: "task and deadline are required" });
  }

  const todo = {
    id: id++,
    task,
    deadline,
    status: status || "todo",
    checked: false
  };

  todos.push(todo);
  res.status(201).json(todo);
});

/**
 * UPDATE task
 */
app.put("/api/todos/:id", (req, res) => {
  const todo = todos.find(t => t.id === Number(req.params.id));
  if (!todo) return res.sendStatus(404);

  const { task, deadline, status, checked } = req.body;

  if (task !== undefined) todo.task = task;
  if (deadline !== undefined) todo.deadline = deadline;
  if (status !== undefined) todo.status = status;
  if (checked !== undefined) todo.checked = checked;

  res.json(todo);
});

/**
 * DELETE task
 */
app.delete("/api/todos/:id", (req, res) => {
  todos = todos.filter(t => t.id !== Number(req.params.id));
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
