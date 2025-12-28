import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './Dialog.css';

export function UpdateTaskDialog({ isOpen, onClose, onUpdate, task }) {
  const [name, setName] = useState(task.name);
  const [deadline, setDeadline] = useState(task.deadline);
  const [status, setStatus] = useState(task.status);

  useEffect(() => {
    setName(task.name);
    setDeadline(task.deadline);
    setStatus(task.status);
  }, [task]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && deadline) {
      onUpdate({ name: name.trim(), deadline, status });
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2 className="dialog-title">Update Task</h2>
          <button onClick={onClose} className="dialog-close">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label htmlFor="update-task-name" className="form-label">
              Task Name
            </label>
            <input
              id="update-task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="update-deadline" className="form-label">
              Deadline
            </label>
            <input
              id="update-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="update-status" className="form-label">
              Status
            </label>
            <select
              id="update-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              <option value="todo">To Do</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="dialog-button cancel">
              Cancel
            </button>
            <button type="submit" className="dialog-button update">
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
