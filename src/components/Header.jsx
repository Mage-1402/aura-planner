import React from 'react';
import { Search, Moon, Sun, LayoutList, Columns } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

const Header = ({ searchQuery, setSearchQuery }) => {
  const { settings, toggleTheme, setView } = useTasks();

  return (
    <header className="header">
      <div className="search-bar animate-fade-in">
        <Search size={18} className="nav-icon" />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search tasks... (Press '/' to focus)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-actions animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="view-toggle">
          <button 
            className={`view-btn ${settings.view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
            title="List View"
          >
            <LayoutList size={18} />
          </button>
          <button 
            className={`view-btn ${settings.view === 'kanban' ? 'active' : ''}`}
            onClick={() => setView('kanban')}
            title="Kanban View"
          >
            <Columns size={18} />
          </button>
        </div>

        <button className="icon-button" onClick={toggleTheme} title="Toggle Theme">
          {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
