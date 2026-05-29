import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext();

const defaultCategories = [
  { id: '1', name: 'Work', color: '#3B82F6' },
  { id: '2', name: 'Personal', color: '#10B981' },
  { id: '3', name: 'Health', color: '#F43F5E' }
];

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('adv_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('adv_categories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('adv_settings');
    return saved ? JSON.parse(saved) : { theme: 'dark', view: 'list', remindersEnabled: false };
  });

  const [deletedTask, setDeletedTask] = useState(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('adv_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('adv_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('adv_settings', JSON.stringify(settings));
    // Apply theme to body
    document.body.className = settings.theme;
  }, [settings]);

  // Task Operations
  const addTask = (task) => {
    const newTask = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      subtasks: [],
      tags: [],
      reminderTime: '', // Format: 'HH:MM'
      ...task
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    
    setDeletedTask(taskToDelete);
    setTasks(prev => prev.filter(t => t.id !== id));
    
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    
    const timeout = setTimeout(() => {
      setDeletedTask(null);
    }, 5000);
    setUndoTimeoutId(timeout);
  };

  const undoDelete = () => {
    if (deletedTask) {
      setTasks(prev => [...prev, deletedTask]);
      setDeletedTask(null);
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
    }
  };

  const addCategory = (name) => {
    const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    
    const colors = ['#3B82F6', '#10B981', '#F43F5E', '#9061f9', '#06b6d4', '#f59e0b'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCat = {
      id: Date.now().toString() + Math.random().toString().substring(2, 6),
      name,
      color: randomColor
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const reorderTasks = (reorderedTasks) => {
    setTasks(reorderedTasks);
  };

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const toggleReminders = () => {
    setSettings(prev => ({ ...prev, remindersEnabled: !prev.remindersEnabled }));
  };

  const setView = (view) => {
    setSettings(prev => ({ ...prev, view }));
  };

  return (
    <TaskContext.Provider value={{
      tasks, addTask, updateTask, deleteTask, reorderTasks,
      categories, addCategory,
      settings, toggleTheme, toggleReminders, setView,
      deletedTask, undoDelete
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
