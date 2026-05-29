import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Inbox, 
  AlertCircle, 
  Clock, 
  Hash, 
  LayoutDashboard
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';

const Sidebar = ({ currentFilter, setFilter }) => {
  const { categories, tasks } = useTasks();

  const filters = [
    { id: 'all', label: 'All Tasks', icon: <Inbox size={18} /> },
    { id: 'today', label: 'Today', icon: <Calendar size={18} /> },
    { id: 'week', label: 'This Week', icon: <LayoutDashboard size={18} /> },
    { id: 'active', label: 'Active', icon: <Clock size={18} /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={18} /> },
    { id: 'overdue', label: 'Overdue', icon: <AlertCircle size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <CheckCircle2 size={28} />
        <span>AuraTasks</span>
      </div>

      <div className="nav-section animate-fade-in">
        <div className="nav-section-title">Views</div>
        {filters.map(f => (
          <button 
            key={f.id}
            className={`nav-item ${currentFilter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            <span className="nav-icon">{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="nav-section-title">Projects</div>
        {categories.map(c => {
          const projectTasks = tasks.filter(t => t.categoryId === c.id);
          const completed = projectTasks.filter(t => t.completed).length;
          const total = projectTasks.length;
          const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

          return (
            <button 
              key={c.id}
              className={`nav-item ${currentFilter === `cat_${c.id}` ? 'active' : ''}`}
              onClick={() => setFilter(`cat_${c.id}`)}
            >
              <span 
                className="nav-icon" 
                style={{ color: currentFilter === `cat_${c.id}` ? 'white' : c.color }}
              >
                <Hash size={18} />
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>{c.name}</span>
                {total > 0 && (
                  <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: currentFilter === `cat_${c.id}` ? 'white' : c.color, transition: 'width 0.3s ease' }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
