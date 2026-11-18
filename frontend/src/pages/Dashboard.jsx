import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ListTodo, 
  Percent, 
  Plus, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';
import { dashboardAPI, taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';

export const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Add / Edit / Delete modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardAPI.getSummary();
      setSummary(res.data.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleStatus = async (task) => {
    try {
      if (task.status === 'COMPLETED') {
        await taskAPI.markPending(task.id);
      } else {
        await taskAPI.markComplete(task.id);
      }
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your productivity and pending deliverables</p>
        </div>
        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} 
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Quick Add Task</span>
        </button>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <StatCard 
              icon={ListTodo} 
              iconBg="#eef2ff" 
              iconColor="#4f46e5" 
              label="Total Tasks" 
              value={summary?.totalTasks || 0} 
            />
            <StatCard 
              icon={Clock} 
              iconBg="#fffbeb" 
              iconColor="#d97706" 
              label="Pending" 
              value={summary?.pendingTasks || 0} 
            />
            <StatCard 
              icon={CheckCircle2} 
              iconBg="#ecfdf5" 
              iconColor="#059669" 
              label="Completed" 
              value={summary?.completedTasks || 0}
              progress={summary?.completionPercentage || 0}
              progressColor="#10b981"
            />
            <StatCard 
              icon={Calendar} 
              iconBg="#fef2f2" 
              iconColor="#dc2626" 
              label="Due Today" 
              value={summary?.dueToday || 0} 
            />
          </div>

          {/* Quick Stats Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
            borderRadius: '16px', 
            padding: '24px 28px', 
            color: '#fff', 
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
                Overall Progress: {summary?.completionPercentage || 0}% Completed
              </h3>
              <p style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                You have {summary?.pendingTasks || 0} pending task{summary?.pendingTasks === 1 ? '' : 's'} remaining.
              </p>
            </div>
            <Link 
              to="/tasks" 
              style={{ 
                background: '#fff', 
                color: '#4f46e5', 
                padding: '10px 18px', 
                borderRadius: '8px', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>View All Tasks</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Recent Tasks Section */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Tasks</h2>
            <Link to="/tasks" style={{ color: '#4f46e5', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>See all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {summary?.recentTasks?.length > 0 ? (
            <div className="task-list">
              {summary.recentTasks.map(task => (
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
              <h3 className="empty-title">No tasks created yet</h3>
              <p className="empty-text">Start your day by adding your first task to stay organized and on track.</p>
              <button 
                onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} 
                className="btn-primary"
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            </div>
          )}
        </>
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
        message={`Are you sure you want to permanently delete "${deleteTaskTarget?.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default Dashboard;
