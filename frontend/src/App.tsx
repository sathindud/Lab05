import { useState, useEffect } from 'react'
import './App.css'

interface TaskItem {
  id: number;
  title: string;
  isCompleted: boolean;
}

const API_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/tasks` 
  : 'http://localhost:5208/tasks';

function App() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Could not connect to the API. Make sure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 0, // Id assigned by backend
          title: newTaskTitle.trim(),
          isCompleted: false
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add task');
      
      const addedTask = await response.json();
      setTasks([...tasks, addedTask]);
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
      alert('Failed to add task');
    }
  };

  const toggleTask = async (task: TaskItem) => {
    try {
      const updatedTask = { ...task, isCompleted: !task.isCompleted };
      
      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));

      const response = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }
    } catch (err) {
      console.error(err);
      // Revert on failure
      fetchTasks();
    }
  };

  const deleteTask = async (id: number) => {
    try {
      // Optimistic update
      setTasks(tasks.filter(t => t.id !== id));

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
    } catch (err) {
      console.error(err);
      // Revert on failure
      fetchTasks();
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Tasks</h1>
        <p>Stay organized, focused, and productive.</p>
      </header>

      <form className="add-task-form" onSubmit={addTask}>
        <input
          type="text"
          className="task-input"
          placeholder="What needs to be done?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="add-btn" disabled={!newTaskTitle.trim() || isLoading}>
          Add
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {isLoading && !error ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="task-list">
          {tasks.length === 0 && !error ? (
            <div className="empty-state">No tasks yet. Add one above!</div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className={`task-item ${task.isCompleted ? 'completed' : ''}`}
              >
                <div className="task-content" onClick={() => toggleTask(task)}>
                  <div className="checkbox">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="task-title">{task.title}</span>
                </div>
                <button 
                  className="delete-btn" 
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default App
