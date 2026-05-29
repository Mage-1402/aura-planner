import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, AlignLeft, Bell } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

const TaskModal = ({ onClose, initialTask = null }) => {
  const { addTask, updateTask, categories } = useTasks();
  
  const [title, setTitle] = useState(initialTask?.title || '');
  const [notes, setNotes] = useState(initialTask?.notes || '');
  const [categoryId, setCategoryId] = useState(initialTask?.categoryId || categories[0]?.id || '');
  const [priority, setPriority] = useState(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || '');
  const [reminderTime, setReminderTime] = useState(initialTask?.reminderTime || '');

  // Animation for modal mounting
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Focus title input on mount
    const input = document.getElementById('task-title-input');
    if (input) input.focus();
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200); // Wait for animation
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const taskData = {
      title,
      notes,
      categoryId,
      priority,
      dueDate,
      reminderTime,
    };

    if (initialTask) {
      updateTask(initialTask.id, taskData);
    } else {
      addTask(taskData);
    }

    handleClose();
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
        <div className="modal-header">
          <input 
            id="task-title-input"
            type="text" 
            className="modal-title-input" 
            placeholder="What needs to be done?" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <button className="icon-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <AlignLeft size={16} className="input-icon" />
            <textarea 
              className="notes-input" 
              placeholder="Add description or notes..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-grid">
            <div className="input-group-field">
              <label><Calendar size={14} /> Due Date</label>
              <input 
                type="date" 
                className="date-input" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            
            <div className="input-group-field">
              <label><Flag size={14} /> Priority</label>
              <select 
                className="select-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="input-group-field">
              <label><Bell size={14} /> Reminder Time</label>
              <input 
                type="time" 
                className="date-input" 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>

            <div className="input-group-field" style={{ gridColumn: 'span 2' }}>
              <label><Tag size={14} /> Project</label>
              <div className="project-selector">
                {categories.map(c => (
                  <button 
                    key={c.id}
                    className={`project-pill ${categoryId === c.id ? 'active' : ''}`}
                    style={{ 
                      '--cat-color': c.color,
                      borderColor: categoryId === c.id ? c.color : 'transparent',
                      backgroundColor: categoryId === c.id ? `${c.color}20` : 'var(--bg-hover)'
                    }}
                    onClick={() => setCategoryId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!title.trim()}>
            {initialTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .modal-overlay.closing {
          animation: fadeOut 0.2s ease forwards;
        }
        .modal-content {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 500px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow: hidden;
        }
        .modal-content.closing {
          animation: slideDown 0.2s ease forwards;
        }
        @keyframes fadeOut { to { opacity: 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideDown { to { opacity: 0; transform: translateY(20px) scale(0.95); } }
        
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-title-input {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-main);
          width: 100%;
          background: transparent;
        }
        .modal-title-input::placeholder { color: var(--text-muted); }
        
        .modal-body {
          padding: 24px;
        }
        .input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .input-icon {
          color: var(--text-muted);
          margin-top: 4px;
        }
        .notes-input {
          width: 100%;
          background: transparent;
          color: var(--text-main);
          resize: vertical;
          font-size: 14px;
        }
        .notes-input::placeholder { color: var(--text-muted); }
        
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .input-group-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group-field label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .date-input, .select-input {
          padding: 10px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background-color: var(--bg-main);
          color: var(--text-main);
          font-size: 14px;
        }
        
        .project-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .project-pill {
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 500;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          color: var(--text-main);
        }
        .project-pill:hover {
          background-color: var(--border-color) !important;
        }
        .project-pill.active {
          color: var(--cat-color);
        }
        
        .modal-footer {
          padding: 16px 24px;
          background-color: var(--bg-hover);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid var(--border-color);
        }
        .btn-secondary {
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-weight: 500;
          color: var(--text-main);
          background-color: transparent;
        }
        .btn-secondary:hover {
          background-color: rgba(0,0,0,0.05);
        }
        body.dark .btn-secondary:hover { background-color: rgba(255,255,255,0.05); }
        .btn-primary {
          padding: 8px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          color: white;
          background-color: var(--primary);
          transition: background-color 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TaskModal;
