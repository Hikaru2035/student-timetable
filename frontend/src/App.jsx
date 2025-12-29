import { Navbar } from './components/Navbar';
import { TaskTable } from './components/TaskTable';
import { ActionButtons } from './components/ActionButtons';
import { AddTaskDialog } from './components/AddTaskDialog';
import { UpdateTaskDialog } from './components/UpdateTaskDialog';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://172.16.220.86:3000/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [currentView, setCurrentView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => {
    fetch(API_BASE_URL)
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error('Fetch tasks failed:', err));
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesView =
      currentView === 'all'
        ? true
        : currentView === 'done'
        ? task.status === 'done'
        : task.status === 'todo';

    const matchesSearch = task.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesView && matchesSearch;
  });

  const handleAddTask = async (task) => {
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error('Add task failed:', err);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    if (selectedTaskIds.length !== 1) return;

    const taskId = selectedTaskIds[0];

    try {
      await fetch(`${API_BASE_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updatedTask }
          : task
      ));

      setSelectedTaskIds([]);
      setIsUpdateDialogOpen(false);
    } catch (err) {
      console.error('Update task failed:', err);
    }
  };

  const handleDeleteTasks = async () => {
    try {
      await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTaskIds }),
      });

      setTasks(tasks.filter(task => !selectedTaskIds.includes(task.id)));
      setSelectedTaskIds([]);
    } catch (err) {
      console.error('Delete tasks failed:', err);
    }
  };

 const handleToggleTask = (taskId) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'todo' ? 'done' : 'todo';

    try {
      await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setTasks(tasks.map(t =>
        t.id === task.id ? { ...t, status: newStatus } : t
      ));
    } catch (err) {
      console.error('Toggle status failed:', err);
    }
  };

  const selectedTask =
    selectedTaskIds.length === 1
      ? tasks.find(t => t.id === selectedTaskIds[0])
      : undefined;

  return (
    <div className="app-container">
      {/* Left Navbar - 20% */}
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      {/* Right Main Content - 80% */}
      <div className="main-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Task Table */}
        <div className="table-container">
          <TaskTable
            tasks={filteredTasks}
            selectedTaskIds={selectedTaskIds}
            onToggleTask={handleToggleTask}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        {/* Action Buttons */}
        <ActionButtons
          hasSelection={selectedTaskIds.length > 0}
          canUpdate={selectedTaskIds.length === 1}
          onAdd={() => setIsAddDialogOpen(true)}
          onUpdate={() => setIsUpdateDialogOpen(true)}
          onDelete={handleDeleteTasks}
        />
      </div>

      {/* Dialogs */}
      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddTask}
      />

      {selectedTask && (
        <UpdateTaskDialog
          isOpen={isUpdateDialogOpen}
          onClose={() => setIsUpdateDialogOpen(false)}
          onUpdate={handleUpdateTask}
          task={selectedTask}
        />
      )}
    </div>
  );
}
