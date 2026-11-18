import React from 'react';
import { 
  Check, 
  Calendar, 
  Clock, 
  Edit3, 
  Trash2, 
  CheckCircle2 
} from 'lucide-react';

export const TaskCard = ({ task, onToggleStatus, onEdit, onDelete }) => {
  const isCompleted = task.status === 'COMPLETED';

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if overdue
  const isOverdue = !isCompleted && task.due_date && new Date(task.due_date).setHours(23,59,59,999) < Date.now();

  return (
    <div className={`task-card ${isCompleted ? 'completed' : ''}`}>
      <div className="task-card-left">
        <button 
          onClick={() => onToggleStatus(task)} 
          className={`checkbox-btn ${isCompleted ? 'checked' : ''}`}
          aria-label={isCompleted ? "Mark task as pending" : "Mark task as completed"}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="task-details">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h4 className="task-title">{task.title}</h4>
            <span className={`badge ${isCompleted ? 'badge-completed' : (isOverdue ? 'badge-overdue' : 'badge-pending')}`}>
              {isCompleted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending')}
            </span>
          </div>

          {task.description && (
            <p className="task-desc">{task.description}</p>
          )}

          <div className="task-meta-bar">
            {task.due_date && (
              <span className="task-meta-item">
                <Calendar size={13} />
                <span>Due: {formatDate(task.due_date)}</span>
              </span>
            )}

            <span className="task-meta-item">
              <Clock size={13} />
              <span>Created: {formatTimestamp(task.created_at)}</span>
            </span>

            {isCompleted && task.completed_at && (
              <span className="task-meta-item" style={{ color: '#059669' }}>
                <CheckCircle2 size={13} />
                <span>Finished: {formatTimestamp(task.completed_at)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        {onEdit && (
          <button 
            onClick={() => onEdit(task)} 
            className="icon-action-btn"
            title="Edit task"
            aria-label="Edit task"
          >
            <Edit3 size={16} />
          </button>
        )}
        {onDelete && (
          <button 
            onClick={() => onDelete(task)} 
            className="icon-action-btn delete"
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
