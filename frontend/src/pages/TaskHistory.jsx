import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ListFilter,
  AlertCircle 
} from 'lucide-react';
import { historyAPI } from '../services/api';
import TaskCard from '../components/TaskCard';

export const TaskHistory = () => {
  const [filterMode, setFilterMode] = useState('daily'); // 'daily', 'monthly', 'range'
  const today = new Date().toISOString().split('T')[0];
  const currentDate = new Date();

  // Daily Filter State
  const [selectedDate, setSelectedDate] = useState(today);

  // Monthly Filter State
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getUTCFullYear());

  // Range Filter State
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Response Data State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (filterMode === 'daily') {
        res = await historyAPI.getDaily(selectedDate);
      } else if (filterMode === 'monthly') {
        res = await historyAPI.getMonthly(selectedMonth, selectedYear);
      } else if (filterMode === 'range') {
        if (startDate > endDate) {
          setError('Start date cannot be after end date.');
          setLoading(false);
          return;
        }
        res = await historyAPI.getRange(startDate, endDate);
      }

      setReportData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve historical tasks.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterMode, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const formatHeaderDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historical Reports</h1>
          <p className="page-subtitle">Analyze historical tasks retrieved directly from MySQL</p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterMode('daily')}
          className={filterMode === 'daily' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <Calendar size={15} />
          <span>Daily Filter</span>
        </button>

        <button 
          onClick={() => setFilterMode('monthly')}
          className={filterMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <History size={15} />
          <span>Monthly Filter</span>
        </button>

        <button 
          onClick={() => setFilterMode('range')}
          className={filterMode === 'range' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <ListFilter size={15} />
          <span>Date Range Filter</span>
        </button>
      </div>

      {/* Filter Parameters Controls */}
      <div className="toolbar-card" style={{ marginBottom: '24px' }}>
        {filterMode === 'daily' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
              Select Date:
            </label>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: 'auto' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        {filterMode === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
              Month:
            </label>
            <select 
              className="filter-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
              Year:
            </label>
            <select 
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {filterMode === 'range' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
              From:
            </label>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: 'auto' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
              To:
            </label>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: 'auto' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}

        {/* Aggregate Summary Badges */}
        {reportData && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              Total: <strong>{reportData.total}</strong>
            </span>
            <span className="badge badge-pending">
              {reportData.pending} Pending
            </span>
            <span className="badge badge-completed">
              {reportData.completed} Completed
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Report Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Querying historical database records...
        </div>
      ) : reportData && reportData.total > 0 ? (
        <div>
          {/* For Monthly & Range: Grouped by date */}
          {(filterMode === 'monthly' || filterMode === 'range') && reportData.groupedByDate ? (
            Object.entries(reportData.groupedByDate).map(([dateKey, groupTasks]) => (
              <div key={dateKey} className="history-date-group">
                <div className="history-date-header">
                  <span>{formatHeaderDate(dateKey)}</span>
                  <span className="history-date-badge">{groupTasks.length} task{groupTasks.length === 1 ? '' : 's'}</span>
                </div>
                <div className="task-list">
                  {groupTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggleStatus={() => {}}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* Daily filter list */
            <div className="task-list">
              {reportData.tasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggleStatus={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <History size={28} />
          </div>
          <h3 className="empty-title">No tasks found for this period</h3>
          <p className="empty-text">
            No to-do tasks were created on or within the selected date criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskHistory;
