import React from 'react';

export const StatCard = ({ icon: Icon, iconColor, iconBg, label, value, progress, progressColor }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
        <Icon size={24} />
      </div>
      <div className="stat-info" style={{ flex: 1 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {progress !== undefined && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
                backgroundColor: progressColor || '#4f46e5'
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
