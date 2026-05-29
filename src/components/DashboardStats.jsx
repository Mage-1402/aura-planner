import React from 'react';
import { useTasks } from '../context/TaskContext';

const DashboardStats = ({ date }) => {
  const { tasks } = useTasks();

  // For this view, we calculate stats based on the whole dataset or just 'today'?
  // Usually, daily planners show stats for the specific date.
  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  };

  const targetDateStr = getLocalDateString(date);
  const todayStr = getLocalDateString(new Date());
  const isViewingToday = targetDateStr === todayStr;

  const dayTasks = tasks.filter(t => 
    (t.dueDate && t.dueDate === targetDateStr) || (!t.dueDate && isViewingToday)
  );
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.completed).length;
  const highPriority = dayTasks.filter(t => t.priority === 'high' && !t.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="stats-section">
      <div className="progress-ring-wrap">
        <svg viewBox="0 0 80 80" className="progress-svg">
          <circle className="progress-bg" cx="40" cy="40" r="32" />
          <circle 
            className="progress-fill" 
            cx="40" cy="40" r="32" 
            strokeDasharray="201" 
            strokeDashoffset={201 - (201 * progress) / 100} 
          />
        </svg>
        <div className="progress-text">
          <span className="progress-pct">{progress}%</span>
          <span className="progress-lbl">DONE</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-pill">
          <div className="stat-num">{total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num">{highPriority}</div>
          <div className="stat-label">High Priority</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num">0</div>
          <div className="stat-label">Habits Done</div>
        </div>
      </div>

      <style>{`
        .stats-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .progress-ring-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }
        
        .progress-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        
        .progress-bg {
          fill: none;
          stroke: var(--bg-hover);
          stroke-width: 6;
        }
        
        .progress-fill {
          fill: none;
          stroke: var(--primary);
          stroke-width: 6;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s ease-out;
        }
        
        .progress-text {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .progress-pct {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
          line-height: 1;
        }
        
        .progress-lbl {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-top: 2px;
        }
        
        .stats-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .stat-pill {
          background-color: var(--bg-hover);
          border-radius: var(--radius-md);
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
        }
        
        .stat-num {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }
        
        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default DashboardStats;
