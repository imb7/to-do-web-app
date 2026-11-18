import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { taskAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import ConfirmModal from '../components/ConfirmModal';

export const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await taskAPI.getTasks({ status: 'COMPLETED', sortBy: 'updated_at', order: 'DESC' });
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch completed tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const handleToggleStatus = async (task) => {
    try {
      // Reopening task (marking as pending)
      await taskAPI.markPending(task.id);
      fetchCompletedTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    try {
      await taskAPI.deleteTask(deleteTaskTarget.id);
      setDeleteTaskTarget(null);
      fetchCompletedTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Completed Tasks</h1>
          <p className="page-subtitle">Archive of all tasks you have successfully finished</p>
        </div>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading completed tasks...
        </div>
      ) : tasks.length > 0 ? (
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggleStatus={handleToggleStatus}
              onDelete={(t) => setDeleteTaskTarget(t)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={28} />
          </div>
          <h3 className="empty-title">No completed tasks yet</h3>
          <p className="empty-text">
            When you complete tasks from your to-do list, they will appear here along with their completion timestamps.
          </p>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal 
        isOpen={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleDeleteTask}
        title="Delete Completed Task"
        message={`Are you sure you want to permanently delete "${deleteTaskTarget?.title}"?`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default CompletedTasks;
