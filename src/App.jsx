import React, { useState, useEffect } from 'react';
import './App.css';
import { useTasks } from './context/TaskContext';
import ListView from './components/ListView';
import DashboardStats from './components/DashboardStats';
import PomodoroTimer from './components/PomodoroTimer';
import { 
  CheckCircle2, Moon, Sun, ChevronLeft, ChevronRight,
  ListTodo, Calendar as CalendarIcon, Dumbbell, ScrollText,
  Quote, Bell, MessageSquare, Send, Bot, Sparkles, Plus, X,
  Trash2
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import TaskModal from './components/TaskModal';
import CalendarView from './components/CalendarView';

function App() {
  const { settings, toggleTheme, tasks, toggleReminders, updateTask, addTask, categories, addCategory } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('tasks');
  const [activeReminder, setActiveReminder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(() => {
    const saved = localStorage.getItem('aura_chat_open');
    return saved ? JSON.parse(saved) : false;
  });
  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('aura_chat_messages');
    return saved ? JSON.parse(saved) : [
      { sender: 'bot', text: 'Hello! I am AuraBot, your personal planner assistant. How is your day going?' }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [pendingTasks, setPendingTasks] = useState(() => {
    const saved = localStorage.getItem('aura_pending_tasks');
    return saved ? JSON.parse(saved) : null;
  });

  const notifiedRef = React.useRef(new Set());
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(scrollToBottom, 80);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    localStorage.setItem('aura_chat_open', JSON.stringify(isChatOpen));
  }, [isChatOpen]);

  useEffect(() => {
    localStorage.setItem('aura_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (pendingTasks) {
      localStorage.setItem('aura_pending_tasks', JSON.stringify(pendingTasks));
    } else {
      localStorage.removeItem('aura_pending_tasks');
    }
  }, [pendingTasks]);

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateVal}`;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const updatedMessages = [...chatMessages, { sender: 'user', text: userMsg }];
    setChatMessages(updatedMessages);
    setChatInput('');

    // Typing loader
    setChatMessages(prev => [...prev, { sender: 'bot', text: 'Thinking...', isTyping: true }]);

    const query = userMsg.toLowerCase();

    try {
      const formattedHistory = updatedMessages
         .filter(m => !m.isTyping)
         .map(m => ({
           role: m.sender === 'user' ? 'user' : 'assistant',
           content: m.text
         }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: formattedHistory,
          currentDate: getLocalDateString(currentDate),
          existingTasks: tasks.map(t => ({
            title: t.title,
            dueDate: t.dueDate,
            completed: t.completed,
            categoryName: categories.find(c => c.id === t.categoryId)?.name || ''
          }))
        })
      });

      // Safe JSON checking to prevent HTML error parsing crashes
      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(response.status === 504 || response.status === 502
          ? 'Backend server is not running on port 5000. Please run "npm run dev:all" to launch the server.'
          : 'Server returned a non-JSON response.');
      }

      setChatMessages(prev => prev.filter(m => !m.isTyping));

      if (response.ok && data.choices && data.choices[0]) {
        const botResponse = data.choices[0].message.content;
        
        // Parse lines starting with "TASK: "
        const lines = botResponse.split('\n');
        const tasksFound = [];
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('TASK:')) {
            const taskInfo = trimmed.substring(5).trim();
            if (taskInfo) {
              const parts = taskInfo.split('|');
              const title = parts[0] ? parts[0].trim() : '';
              const dueDate = parts[1] ? parts[1].trim() : getLocalDateString(currentDate);
              const categoryName = parts[2] ? parts[2].trim() : '';
              const notes = parts[3] ? parts[3].trim() : 'Generated by AuraBot AI Plan';
              
              if (title) {
                tasksFound.push({
                  title: title,
                  dueDate: dueDate,
                  categoryName: categoryName,
                  priority: 'medium',
                  notes: notes
                });
              }
            }
          }
        });

        // Ensure sequential daily dates for day-by-day plans
        let baseStartDate = null;
        const processedTasks = tasksFound.map((t, index) => {
          const dayMatch = t.title.match(/Day\s*(\d+)/i);
          const dayNum = dayMatch ? parseInt(dayMatch[1]) : (index + 1);
          
          if (!baseStartDate) {
            if (t.dueDate) {
              const parts = t.dueDate.split('-');
              if (parts.length === 3) {
                baseStartDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              } else {
                baseStartDate = new Date(t.dueDate);
              }
            } else {
              baseStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            }
          }
          
          const targetDateObj = new Date(baseStartDate.getFullYear(), baseStartDate.getMonth(), baseStartDate.getDate() + (dayNum - 1));
          
          const year = targetDateObj.getFullYear();
          const month = String(targetDateObj.getMonth() + 1).padStart(2, '0');
          const dateVal = String(targetDateObj.getDate()).padStart(2, '0');
          
          const titlePrefix = dayMatch ? '' : `Day ${dayNum}: `;
          
          return {
            ...t,
            title: `${titlePrefix}${t.title}`,
            dueDate: `${year}-${month}-${dateVal}`
          };
        });

        if (processedTasks.length > 0) {
          setPendingTasks(processedTasks);
          setChatMessages(prev => [...prev, {
            sender: 'bot',
            text: botResponse,
            hasPermissionPrompt: true
          }]);
        } else {
          setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        }
      } else {
        const errorMsg = (data.error && typeof data.error === 'object' ? data.error.message : data.error) || 'Server error';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.filter(m => !m.isTyping));

      // Offline / Connection Fallback
      if (query.includes('python') && (query.includes('schedule') || query.includes('cron') || query.includes('run') || query.includes('task'))) {
        const tasksToPropose = [
          { title: 'Create python script & setup schedule library', priority: 'high', notes: 'Install requirements, import schedule, define main worker loop.', dueDate: getLocalDateString(currentDate), categoryName: 'Python Automation' },
          { title: 'Write cron job / system scheduler configuration', priority: 'medium', notes: 'Setup crontab on Linux or Task Scheduler on Windows to run background python processes.', dueDate: getLocalDateString(currentDate), categoryName: 'Python Automation' },
          { title: 'Implement logging & failure notifications', priority: 'low', notes: 'Configure file log handlers and email/Slack alerts for script failures.', dueDate: getLocalDateString(currentDate), categoryName: 'Python Automation' }
        ];

        setPendingTasks(tasksToPropose);
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          text: 'I detected a request for scheduling Python scripts! I prepared 3 integration tasks for you. Do you give permission to add them to your list? (Offline Fallback)',
          hasPermissionPrompt: true
        }]);
      } else if (query.includes('ai engineer') || query.includes('ai') || query.includes('engineer') || query.includes('6') || query.includes('plan')) {
        const tasksToPropose = [
          { title: 'Day 1: Learn Python Fundamentals & Variables', priority: 'high', notes: 'Understand syntax, variables, data types, and basic operations.', dueDate: getLocalDateString(currentDate), categoryName: 'AI Engineering' },
          { title: 'Day 2: Python Control Flow & Functions', priority: 'high', notes: 'Master loops, if-else statements, and function definitions.', dueDate: getLocalDateString(addDays(currentDate, 1)), categoryName: 'AI Engineering' },
          { title: 'Day 3: NumPy Arrays & Operations', priority: 'medium', notes: 'Study array creation, indexing, slicing, and vectorization.', dueDate: getLocalDateString(addDays(currentDate, 2)), categoryName: 'AI Engineering' },
          { title: 'Day 4: Pandas DataFrames & Data Cleaning', priority: 'medium', notes: 'Learn to read CSVs, filter rows, handle missing values, and group data.', dueDate: getLocalDateString(addDays(currentDate, 3)), categoryName: 'AI Engineering' },
          { title: 'Day 5: Math Foundations - Linear Algebra', priority: 'medium', notes: 'Study vectors, matrices, dot products, and matrix multiplication.', dueDate: getLocalDateString(addDays(currentDate, 4)), categoryName: 'AI Engineering' }
        ];

        setPendingTasks(tasksToPropose);
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          text: 'Here is the day-by-day plan to kick off your 6-month AI Engineer roadmap! Proposing these initial daily tasks for you. (Offline Fallback)',
          hasPermissionPrompt: true
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `AuraBot: ${err.message || 'Connection error'}. Please configure GROQ_API_KEY in the root .env file and run the backend server.` 
        }]);
      }
    }
  };

  const handleAcceptPendingTasks = () => {
    if (pendingTasks) {
      pendingTasks.forEach(pt => {
        let categoryId = '';
        if (pt.categoryName) {
          const cat = addCategory(pt.categoryName);
          categoryId = cat.id;
        }

        addTask({
          title: pt.title,
          priority: pt.priority || 'medium',
          notes: pt.notes || 'Generated by AuraBot',
          dueDate: pt.dueDate || getLocalDateString(currentDate),
          categoryId: categoryId
        });
      });
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Successfully added the tasks to your list! 🚀' }]);
      setPendingTasks(null);
    }
  };

  const handleDeclinePendingTasks = () => {
    setChatMessages(prev => [...prev, { sender: 'bot', text: 'No problem, I will not add these tasks.' }]);
    setPendingTasks(null);
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const initialMsg = [
        { sender: 'bot', text: 'Hello! I am AuraBot, your personal planner assistant. How is your day going?' }
      ];
      setChatMessages(initialMsg);
      localStorage.setItem('aura_chat_messages', JSON.stringify(initialMsg));
      setPendingTasks(null);
      localStorage.removeItem('aura_pending_tasks');
    }
  };

  // Sound generator using Web Audio API
  const playReminderSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.error("Audio error", err);
    }
  };

  const handleToggleReminders = () => {
    if (!settings.remindersEnabled) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toggleReminders();
            new Notification("AuraTasks Reminders Enabled!", {
              body: "You will receive system notifications for your tasks.",
            });
            playReminderSound();
          } else {
            alert("Notification permission denied. Please enable notifications in your browser settings.");
          }
        });
      } else {
        alert("System notifications are not supported in this browser. In-app alerts will be used.");
        toggleReminders();
      }
    } else {
      toggleReminders();
    }
  };

  // Keyboard shortcut for Quick Add focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'n' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const quickAdd = document.getElementById('quick-add-input');
        if (quickAdd) quickAdd.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reminder check engine
  useEffect(() => {
    if (!settings.remindersEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = now.toDateString();

      tasks.forEach(task => {
        if (task.completed || !task.reminderTime) return;

        // Check if task is due today
        const isDueToday = task.dueDate ? new Date(task.dueDate).toDateString() === todayStr : true;
        if (!isDueToday) return;

        if (task.reminderTime === currentHourMin) {
          const key = `${task.id}_${todayStr}_${currentHourMin}`;
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            setActiveReminder(task);
            playReminderSound();

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification("AuraTasks Reminder", {
                body: `Time for: ${task.title}`,
              });
            }
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [tasks, settings.remindersEnabled]);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));

  return (
    <div className="app-container">
      <div className="mobile-wrapper animate-fade-in">
        
        {/* TOP HEADER */}
        <header className="top-header">
          <div className="header-left">
            <div className="logo-icon">
              <CheckCircle2 size={24} />
            </div>
            <div className="header-titles">
              <span className="title-main">AURA</span>
              <span className="title-sub">Daily Planner</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`icon-button ${isChatOpen ? 'active-chat' : ''}`} 
              onClick={() => setIsChatOpen(!isChatOpen)} 
              title="AuraBot Chat"
              style={{ color: isChatOpen ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              <Bot size={18} />
            </button>
            <button 
              className={`icon-button ${settings.remindersEnabled ? 'active-bell' : ''}`} 
              onClick={handleToggleReminders} 
              title={settings.remindersEnabled ? "Disable Reminders" : "Enable Reminders"}
              style={{ color: settings.remindersEnabled ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              <Bell size={18} />
            </button>
            <button className="icon-button" onClick={toggleTheme}>
              {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* DATE NAVIGATION */}
        <div className="date-nav">
          <button className="nav-arrow" onClick={handlePrevDay}><ChevronLeft size={20}/></button>
          <div className="date-display">
            <div className="date-day">{format(currentDate, 'EEEE')}</div>
            <div className="date-full">{format(currentDate, 'MMMM d, yyyy')}</div>
          </div>
          <button className="nav-arrow" onClick={handleNextDay}><ChevronRight size={20}/></button>
        </div>

        {/* QUOTE BANNER */}
        <div className="quote-banner">
          <div className="quote-text">
            "Set your heart ablaze. Do not be paralyzed by the fear of failure."
          </div>
          <div className="quote-attr">— Rengoku Kyōjurō</div>
        </div>

        <div className="scroll-content">
          {/* STATS GRID */}
          <DashboardStats date={currentDate} />

          {/* HORIZONTAL TABS */}
          <div className="tabs-container">
            <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
              <ListTodo size={16} /> TASKS
            </button>
            <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
              <CalendarIcon size={16} /> SCHEDULE
            </button>
            <button className={`tab-btn ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>
              <Dumbbell size={16} /> HABITS
            </button>
            <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
              <ScrollText size={16} /> NOTES
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          {activeTab === 'tasks' && <ListView targetDate={currentDate} />}
          {activeTab === 'schedule' && (
            <CalendarView selectedDate={currentDate} onSelectDate={setCurrentDate} />
          )}
          {activeTab !== 'tasks' && activeTab !== 'schedule' && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p>Module coming soon.</p>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION */}
        <nav className="bottom-nav">
          <button className={`bnav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <ListTodo size={24} className="bnav-icon" />
            <span>Tasks</span>
          </button>
          <button className={`bnav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            <CalendarIcon size={24} className="bnav-icon" />
            <span>Schedule</span>
          </button>
          <button className={`bnav-item ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>
            <Dumbbell size={24} className="bnav-icon" />
            <span>Habits</span>
          </button>
          <button className={`bnav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <ScrollText size={24} className="bnav-icon" />
            <span>Notes</span>
          </button>
        </nav>

        <PomodoroTimer />

        {/* Floating Action Button */}
        <button 
          className="fab-btn" 
          onClick={() => setShowCreateModal(true)}
          title="Add New Task"
        >
          <Plus size={28} />
        </button>

        {showCreateModal && (
          <TaskModal onClose={() => setShowCreateModal(false)} />
        )}

        {/* Chatbot Slide-up Panel */}
        {isChatOpen && (
          <div className="chatbot-panel animate-fade-in">
             <div className="chat-header">
               <span className="chat-title">
                 <Bot size={18} className="sparkles" />
                 AuraBot Assistant
               </span>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <button 
                   className="icon-button" 
                   onClick={handleClearChatHistory} 
                   title="Clear Chat History"
                   style={{ color: 'var(--text-muted)' }}
                 >
                   <Trash2 size={16} />
                 </button>
                 <button className="icon-button" onClick={() => setIsChatOpen(false)}>
                   <X size={18} />
                 </button>
               </div>
             </div>
            
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-bubble ${msg.sender}`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  {msg.hasPermissionPrompt && pendingTasks && (
                    <div className="chat-permission-box">
                      <span className="chat-permission-title">Permission Request:</span>
                      <ul style={{ paddingLeft: '16px', fontSize: '11px', marginBottom: '8px', textAlign: 'left' }}>
                        {pendingTasks.map((t, idx) => <li key={idx} style={{ color: 'var(--text-main)' }}>{t.title}</li>)}
                      </ul>
                      <div className="chat-permission-actions">
                        <button className="chat-btn-small primary" onClick={handleAcceptPendingTasks}>Accept & Add</button>
                        <button className="chat-btn-small secondary" onClick={handleDeclinePendingTasks}>Deny</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-bar">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Ask AuraBot (e.g. python schedule)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="chat-send-btn" onClick={handleSendMessage}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {activeReminder && (
          <div className="reminder-alert-overlay">
            <div className="reminder-alert-card">
              <Bell className="reminder-alert-icon animate-bounce" size={40} />
              <h3>Task Reminder</h3>
              <p className="reminder-alert-title">{activeReminder.title}</p>
              {activeReminder.notes && <p className="reminder-alert-notes">{activeReminder.notes}</p>}
              <div className="reminder-alert-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    updateTask(activeReminder.id, { completed: true });
                    setActiveReminder(null);
                  }}
                >
                  Complete
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => setActiveReminder(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
