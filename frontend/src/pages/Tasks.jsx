import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ListTodo, 
  AlertCircle 
} from 'lucide-react';
import { taskAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        sortBy,
        order: sortOrder
      };
      const res = await taskAPI.getTasks(params);
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250); // Small debounce for search
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy, sortOrder]);

  const handleToggleStatus = async (task) => {
    try {
      if (task.status === 'COMPLETED') {
        await taskAPI.markPending(task.id);
      } else {
        await taskAPI.markComplete(task.id);
      }
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleSaveTask = async (taskData) => {
    setModalLoading(true);
    try {
      if (selectedTask) {
        await taskAPI.updateTask(selectedTask.id, taskData);
      } else {
        await taskAPI.createTask(taskData);
      }
      setIsModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    try {
      await taskAPI.deleteTask(deleteTaskTarget.id);
      setDeleteTaskTarget(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Organize, track, and complete your personal to-do items</p>
        </div>
        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} 
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Add Task</span>
        </button>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar: Search, Filters, Sorting */}
      <div className="toolbar-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search tasks by title or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="COMPLETED">Completed Only</option>
          </select>

          <select 
            className="filter-select"
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="created_at_DESC">Newest Created</option>
            <option value="created_at_ASC">Oldest Created</option>
            <option value="due_date_ASC">Due Date (Earliest)</option>
            <option value="due_date_DESC">Due Date (Latest)</option>
            <option value="title_ASC">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading tasks...
        </div>
      ) : tasks.length > 0 ? (
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggleStatus={handleToggleStatus}
              onEdit={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
              onDelete={(t) => setDeleteTaskTarget(t)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <ListTodo size={28} />
          </div>
          <h3 className="empty-title">
            {search || statusFilter ? 'No matching tasks found' : 'No tasks in your list yet'}
          </h3>
          <p className="empty-text">
            {search || statusFilter 
              ? 'Try modifying your search or changing the filter options above.' 
              : 'Add your first task to start organizing your work and tracking progress.'}
          </p>
          {!search && !statusFilter && (
            <button 
              onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} 
              className="btn-primary"
            >
              <Plus size={16} />
              <span>Create Task</span>
            </button>
          )}
        </div>
      )}

      {/* Task Modal for Add/Edit */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
        onSave={handleSaveTask}
        task={selectedTask}
        isLoading={modalLoading}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmModal 
        isOpen={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${deleteTaskTarget?.title}"?`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default Tasks;
