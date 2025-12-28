import { useState } from 'react';
import { X } from 'lucide-react';
import './Dialog.css';

export function AddTaskDialog({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('todo');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && deadline) {
      onAdd({ name: name.trim(), deadline, status });
      setName('');
      setDeadline('');
      setStatus('todo');
    }
  };

  const handleClose = () => {
    setName('');
    setDeadline('');
    setStatus('todo');
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2 className="dialog-title">Add New Task</h2>
          <button onClick={handleClose} className="dialog-close">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label htmlFor="task-name" className="form-label">
              Task Name
            </label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline" className="form-label">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              <option value="todo">To Do</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={handleClose} className="dialog-button cancel">
              Cancel
            </button>
            <button type="submit" className="dialog-button submit">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
