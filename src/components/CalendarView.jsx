import React from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ selectedDate, onSelectDate }) => {
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks = [];
  let week = [];
  days.forEach((day, index) => {
    week.push(day);
    if (week.length === 7 || index === days.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  };

  const getTasksForDay = (day) => {
    const dayStr = getLocalDateString(day);
    return tasks.filter(t => t.dueDate === dayStr);
  };

  const getOverdueTasks = (day) => {
    const dayStr = getLocalDateString(day);
    return tasks.filter(t => {
      if (t.completed || !t.dueDate) return false;
      return t.dueDate < dayStr;
    });
  };

  const selectedDayTasks = getTasksForDay(selectedDate);
  const overdueTasks = getOverdueTasks(selectedDate);

  return (
    <div className="calendar-view animate-fade-in">
      <div className="calendar-header">
        <button onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
        <span className="calendar-month-title">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={handleNextMonth}><ChevronRight size={16} /></button>
      </div>

      <div className="calendar-grid-header">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
          <div key={i} className="calendar-grid-day-lbl">{d}</div>
        ))}
      </div>

      <div className="calendar-weeks">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="calendar-week-row">
            {week.map((day, dIdx) => {
              const dayTasks = getTasksForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              
              return (
                <button
                  key={dIdx}
                  className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday(day) ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                  onClick={() => onSelectDate(day)}
                >
                  <span className="calendar-day-num">{format(day, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <div className="calendar-day-dots">
                      {dayTasks.slice(0, 3).map((t, idx) => (
                        <span 
                          key={idx} 
                          className="calendar-dot" 
                          style={{ backgroundColor: t.completed ? 'var(--success)' : 'var(--primary)' }} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="selected-day-tasks">
        <h4>Tasks for {format(selectedDate, 'MMM d, yyyy')}</h4>
        
        {overdueTasks.length > 0 && (
          <div className="calendar-overdue-section" style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--danger)', display: 'block', marginBottom: '8px' }}>
              INCOMPLETE FROM PAST ({overdueTasks.length})
            </span>
            <div className="calendar-tasks-list" style={{ marginBottom: '12px' }}>
              {overdueTasks.map(t => (
                <div key={t.id} className="cal-task-item">
                  <span className="cal-task-dot" style={{ backgroundColor: 'var(--danger)' }} />
                  <span className="cal-task-title" style={{ color: 'var(--danger)' }}>
                    {t.title} <span style={{ fontSize: '9px', opacity: 0.7, marginLeft: '4px' }}>({t.dueDate})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          SCHEDULED FOR THIS DAY
        </span>
        {selectedDayTasks.length === 0 ? (
          <p className="no-tasks-lbl">No tasks scheduled for this day.</p>
        ) : (
          <div className="calendar-tasks-list">
            {selectedDayTasks.map(t => (
              <div key={t.id} className={`cal-task-item ${t.completed ? 'completed' : ''}`}>
                <span className="cal-task-dot" style={{ backgroundColor: t.completed ? 'var(--success)' : 'var(--primary)' }} />
                <span className="cal-task-title">{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .calendar-view {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 16px;
          margin-bottom: 24px;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .calendar-header button {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background-color: var(--bg-hover);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
        }
        .calendar-month-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-main);
        }
        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          margin-bottom: 8px;
        }
        .calendar-grid-day-lbl {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
        }
        .calendar-weeks {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .calendar-week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .calendar-day-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          background-color: transparent;
          color: var(--text-main);
          transition: all 0.2s;
          position: relative;
          cursor: pointer;
          border: none;
        }
        .calendar-day-cell:hover {
          background-color: var(--bg-hover);
        }
        .calendar-day-cell.selected {
          background-color: var(--primary) !important;
          color: white !important;
          box-shadow: 0 4px 10px rgba(144, 97, 249, 0.3);
        }
        .calendar-day-cell.today {
          border: 1.5px solid var(--primary);
        }
        .calendar-day-cell.other-month {
          opacity: 0.3;
        }
        .calendar-day-num {
          font-size: 13px;
          font-weight: 600;
        }
        .calendar-day-dots {
          display: flex;
          gap: 2px;
          position: absolute;
          bottom: 4px;
        }
        .calendar-dot {
          width: 4px;
          height: 4px;
          border-radius: var(--radius-full);
        }
        .selected-day-tasks {
          margin-top: 20px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }
        .selected-day-tasks h4 {
          font-size: 13px;
          color: var(--text-main);
          font-weight: 700;
          margin-bottom: 12px;
        }
        .no-tasks-lbl {
          font-size: 12px;
          color: var(--text-muted);
        }
        .calendar-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cal-task-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-main);
        }
        .cal-task-item.completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
        .cal-task-dot {
          width: 6px;
          height: 6px;
          border-radius: var(--radius-full);
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
