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
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TaskModal from './TaskModal';

// For simplicity in this example, we map status to 'category' or we can map status to priority.
// To implement a true kanban board for To-Do, In Progress, Done, we need a 'status' field.
// Let's assume we map status based on completed and priority, or we simply show columns based on Priorities.
// A better Kanban approach for this app: Columns by Priority (High, Medium, Low).
// Let's do Columns by Priority.

const KanbanColumn = ({ id, title, tasks, onEdit }) => {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <h3>{title}</h3>
        <span className="column-count">{tasks.length}</span>
      </div>
      <div className="column-body">
        {tasks.map(t => (
          <div key={t.id} className="kanban-card" onClick={() => onEdit(t)}>
            <div className="card-title">{t.title}</div>
            {t.dueDate && <div className="card-date">{new Date(t.dueDate).toLocaleDateString()}</div>}
          </div>
        ))}
        {tasks.length === 0 && <div className="empty-card">Drop tasks here</div>}
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks }) => {
  const [editingTask, setEditingTask] = useState(null);

  const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed);
  const medPriority = tasks.filter(t => t.priority === 'medium' && !t.completed);
  const lowPriority = tasks.filter(t => t.priority === 'low' && !t.completed);
  const completed = tasks.filter(t => t.completed);

  return (
    <div className="kanban-board animate-fade-in">
      <div className="kanban-columns">
        <KanbanColumn id="high" title="High Priority" tasks={highPriority} onEdit={setEditingTask} />
        <KanbanColumn id="medium" title="Medium Priority" tasks={medPriority} onEdit={setEditingTask} />
        <KanbanColumn id="low" title="Low Priority" tasks={lowPriority} onEdit={setEditingTask} />
        <KanbanColumn id="completed" title="Completed" tasks={completed} onEdit={setEditingTask} />
      </div>

      {editingTask && <TaskModal initialTask={editingTask} onClose={() => setEditingTask(null)} />}

      <style>{`
        .kanban-board {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .kanban-columns {
          display: flex;
          gap: 24px;
          height: 100%;
          overflow-x: auto;
          padding-bottom: 24px;
        }
        .kanban-column {
          flex: 1;
          min-width: 300px;
          background-color: var(--bg-sidebar);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          max-height: 100%;
        }
        .column-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .column-header h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .column-count {
          background-color: var(--bg-hover);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
        }
        .column-body {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .kanban-card {
          background-color: var(--bg-card);
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }
        .card-title {
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 8px;
        }
        .card-date {
          font-size: 12px;
          color: var(--text-muted);
        }
        .empty-card {
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
