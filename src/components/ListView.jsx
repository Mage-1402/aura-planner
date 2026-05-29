import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Trash2, Edit2, GripVertical, Flag, Plus, Ghost, Bell, ChevronRight } from 'lucide-react';
import TaskModal from './TaskModal';

const SortableTaskItem = ({ task, onEdit, isOverdue }) => {
  const { updateTask, deleteTask } = useTasks();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    high: 'var(--danger)',
    medium: 'var(--primary)',
    low: 'var(--success)'
  };

  return (
    <div ref={setNodeRef} style={style} className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-drag-handle" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      
      <div 
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => updateTask(task.id, { completed: !task.completed })}
      >
        {task.completed && <Check size={14} />}
      </div>
      
      <div className="task-content" onClick={() => onEdit(task)}>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className="meta-badge" style={{ color: priorityColors[task.priority] }}>
            <Flag size={10} style={{ marginRight: 4 }} />
            {task.priority}
          </span>
          {task.reminderTime && (
            <span className="meta-badge" style={{ color: 'var(--primary)', marginLeft: 8 }}>
              <Bell size={10} style={{ marginRight: 4 }} />
              {task.reminderTime}
            </span>
          )}
          {isOverdue && task.dueDate && (
            <span className="meta-badge" style={{ color: 'var(--danger)', marginLeft: 8 }}>
              ⚠️ Overdue: {task.dueDate}
            </span>
          )}
        </div>
      </div>
      
      <div className="task-actions">
        {isOverdue && (
          <button 
            className="icon-button small reschedule" 
            onClick={(e) => {
              e.stopPropagation();
              const baseDate = task.dueDate 
                ? (() => {
                    const parts = task.dueDate.split('-');
                    return parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) : new Date();
                  })()
                : new Date();
              const nextDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
              const year = nextDay.getFullYear();
              const month = String(nextDay.getMonth() + 1).padStart(2, '0');
              const dayVal = String(nextDay.getDate()).padStart(2, '0');
              updateTask(task.id, { dueDate: `${year}-${month}-${dayVal}` });
            }}
            title="Reschedule to Next Day"
            style={{ color: 'var(--success)', marginRight: '8px' }}
          >
            <ChevronRight size={14} />
          </button>
        )}
        <button className="icon-button small delete" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const ListView = ({ targetDate }) => {
  const { tasks, addTask, reorderTasks, updateTask } = useTasks();
  const [editingTask, setEditingTask] = useState(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, high, medium, low

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      reorderTasks(arrayMove(tasks, oldIndex, newIndex));
    }
  };

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  };

  const handleQuickAdd = () => {
    if (!quickAddText.trim()) return;
    addTask({
      title: quickAddText,
      priority: priorityFilter === 'all' ? 'medium' : priorityFilter,
      dueDate: getLocalDateString(targetDate)
    });
    setQuickAddText('');
  };

  // Filter tasks based on targetDate and overdue status
  const targetDateStr = getLocalDateString(targetDate);
  const todayStr = getLocalDateString(new Date());
  const isViewingToday = targetDateStr === todayStr;

  let displayTasks = tasks;
  if (priorityFilter !== 'all') {
    displayTasks = displayTasks.filter(t => t.priority === priorityFilter);
  }

  // Active tasks due today (or tasks without due date if viewing today)
  const activeTasks = displayTasks.filter(t => 
    !t.completed && 
    ((t.dueDate && t.dueDate === targetDateStr) || (!t.dueDate && isViewingToday))
  );

  // Overdue/Incomplete tasks from past dates relative to the viewing targetDate
  const overdueTasks = displayTasks.filter(t => 
    !t.completed && 
    t.dueDate && 
    t.dueDate < targetDateStr
  );

  // Completed tasks due on the targetDate (or completed tasks without due date if viewing today)
  const completedTasks = displayTasks.filter(t => 
    t.completed && 
    ((t.dueDate && t.dueDate === targetDateStr) || (!t.dueDate && isViewingToday))
  );

  return (
    <div className="list-view animate-fade-in">
      
      {/* Priority Filters */}
      <div className="priority-filters">
        <button 
          className={`pri-filter ${priorityFilter === 'high' ? 'active high' : ''}`}
          onClick={() => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high')}
        >
          <Flag size={12} /> HIGH
        </button>
        <button 
          className={`pri-filter ${priorityFilter === 'medium' ? 'active med' : ''}`}
          onClick={() => setPriorityFilter(priorityFilter === 'medium' ? 'all' : 'medium')}
        >
          <Flag size={12} /> MED
        </button>
        <button 
          className={`pri-filter ${priorityFilter === 'low' ? 'active low' : ''}`}
          onClick={() => setPriorityFilter(priorityFilter === 'low' ? 'all' : 'low')}
        >
          <Flag size={12} /> LOW
        </button>
      </div>

      {/* Quick Add Bar */}
      <div className="quick-add-bar">
        <input 
          id="quick-add-input"
          type="text" 
          className="quick-add-input" 
          placeholder="Add a new mission..." 
          value={quickAddText}
          onChange={(e) => setQuickAddText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
        />
        <button className="quick-add-btn" onClick={handleQuickAdd}>
          <Plus size={24} />
        </button>
      </div>

      {/* Overdue/Incomplete Tasks Section */}
      {overdueTasks.length > 0 && (
        <>
          <div className="section-header" style={{ color: 'var(--danger)' }}>
            <span className="section-title" style={{ color: 'var(--danger)' }}>INCOMPLETE FROM PAST</span>
            <div className="section-line" style={{ backgroundColor: 'rgba(255, 75, 114, 0.2)' }}></div>
            <button 
              className="reschedule-all-btn"
              style={{ 
                fontSize: '10px', 
                padding: '4px 8px', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)', 
                background: 'transparent', 
                borderRadius: 'var(--radius-md)', 
                cursor: 'pointer',
                fontWeight: 'bold',
                marginRight: '8px'
              }}
              onClick={() => {
                overdueTasks.forEach(task => {
                  const baseDate = task.dueDate 
                    ? (() => {
                        const parts = task.dueDate.split('-');
                        return parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) : new Date();
                      })()
                    : new Date();
                  const nextDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
                  const year = nextDay.getFullYear();
                  const month = String(nextDay.getMonth() + 1).padStart(2, '0');
                  const dayVal = String(nextDay.getDate()).padStart(2, '0');
                  updateTask(task.id, { dueDate: `${year}-${month}-${dayVal}` });
                });
              }}
            >
              Move All to Next Day
            </button>
            <span className="section-badge" style={{ backgroundColor: 'rgba(255, 75, 114, 0.1)', color: 'var(--danger)' }}>{overdueTasks.length}</span>
          </div>
          <div className="task-list" style={{ marginBottom: '24px' }}>
            {overdueTasks.map(task => (
              <SortableTaskItem key={task.id} task={task} onEdit={setEditingTask} isOverdue={true} />
            ))}
          </div>
        </>
      )}

      {/* Active Tasks Section */}
      <div className="section-header">
        <span className="section-title">ACTIVE</span>
        <div className="section-line"></div>
        <span className="section-badge">{activeTasks.length}</span>
      </div>

      {activeTasks.length === 0 ? (
        <div className="empty-state">
          <Ghost size={32} className="empty-icon" />
          <p>No tasks?! Get going, you can do it!</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="task-list">
              {activeTasks.map(task => (
                <SortableTaskItem key={task.id} task={task} onEdit={setEditingTask} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 32 }}>
            <span className="section-title">COMPLETED</span>
            <div className="section-line"></div>
            <span className="section-badge">{completedTasks.length}</span>
          </div>
          <div className="task-list">
            {completedTasks.map(task => (
              <SortableTaskItem key={task.id} task={task} onEdit={setEditingTask} />
            ))}
          </div>
        </>
      )}

      {editingTask && <TaskModal initialTask={editingTask} onClose={() => setEditingTask(null)} />}

      <style>{`
        .list-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .priority-filters {
          display: flex;
          gap: 8px;
        }
        
        .pri-filter {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background-color: var(--bg-hover);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.2s;
        }
        
        .pri-filter.active.high { background-color: var(--danger); color: white; border-color: var(--danger); }
        .pri-filter.active.med { background-color: var(--primary); color: white; border-color: var(--primary); }
        .pri-filter.active.low { background-color: var(--success); color: white; border-color: var(--success); }

        .quick-add-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .quick-add-input {
          flex: 1;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          color: var(--text-main);
          font-size: 15px;
          transition: border-color 0.2s;
        }
        
        .quick-add-input:focus {
          border-color: var(--primary);
        }
        
        .quick-add-btn {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, background-color 0.2s;
        }
        
        .quick-add-btn:hover {
          background-color: var(--primary-hover);
          transform: scale(1.05);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0 8px;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        
        .section-line {
          flex: 1;
          height: 1px;
          background-color: var(--border-color);
        }
        
        .section-badge {
          background-color: var(--bg-hover);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .empty-state {
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-lg);
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background-color: var(--bg-hover);
          text-align: center;
        }
        
        .empty-icon {
          color: var(--border-color);
          margin-bottom: 12px;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .task-item {
          display: flex;
          align-items: center;
          background-color: var(--bg-card);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          gap: 12px;
          transition: all 0.2s;
        }
        
        .task-item:hover {
          border-color: var(--primary);
        }
        
        .task-item.completed {
          opacity: 0.5;
        }
        
        .task-item.completed .task-title {
          text-decoration: line-through;
        }
        
        .task-drag-handle {
          cursor: grab;
          color: var(--text-muted);
          padding: 4px;
          margin-left: -8px;
        }
        
        .task-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .task-checkbox.checked {
          background-color: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        
        .task-content {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }
        
        .task-title {
          font-weight: 500;
          font-size: 15px;
          color: var(--text-main);
          margin-bottom: 4px;
        }
        
        .task-meta {
          display: flex;
          gap: 8px;
        }
        
        .meta-badge {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .task-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .task-item:hover .task-actions {
          opacity: 1;
        }
        
        .icon-button.small {
          width: 32px; height: 32px;
        }
      `}</style>
    </div>
  );
};

export default ListView;
