import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react';

const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' | 'break'

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Play sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log(e));
      
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const setModeAndReset = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <button className="pomodoro-fab animate-fade-in" onClick={() => setIsOpen(true)}>
        <Timer size={24} />
      </button>
    );
  }

  const progress = mode === 'work' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="pomodoro-widget animate-slide-up">
      <div className="pomo-header">
        <span className="pomo-title">Focus Timer</span>
        <button className="icon-button small" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </button>
      </div>

      <div className="pomo-modes">
        <button 
          className={`mode-btn ${mode === 'work' ? 'active' : ''}`}
          onClick={() => setModeAndReset('work')}
        >
          Pomodoro
        </button>
        <button 
          className={`mode-btn ${mode === 'break' ? 'active' : ''}`}
          onClick={() => setModeAndReset('break')}
        >
          Break
        </button>
      </div>

      <div className="pomo-display">
        <svg viewBox="0 0 120 120" className="pomo-ring">
          <circle className="ring-bg" cx="60" cy="60" r="54" />
          <circle 
            className="ring-progress" 
            cx="60" cy="60" r="54" 
            strokeDasharray="339.292" 
            strokeDashoffset={339.292 - (339.292 * progress) / 100} 
            style={{ stroke: mode === 'work' ? 'var(--primary)' : 'var(--success)' }}
          />
        </svg>
        <div className="time-text" style={{ color: mode === 'work' ? 'var(--primary)' : 'var(--success)' }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="pomo-controls">
        <button className="icon-button" onClick={resetTimer}>
          <RotateCcw size={20} />
        </button>
        <button className="play-btn" onClick={toggleTimer} style={{ backgroundColor: mode === 'work' ? 'var(--primary)' : 'var(--success)' }}>
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
      </div>

      <style>{`
        .pomodoro-fab {
          position: fixed;
          bottom: 32px;
          left: 32px;
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background-color: var(--bg-card);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 40;
        }
        .pomodoro-fab:hover {
          transform: scale(1.05);
          border-color: var(--primary);
        }
        
        .pomodoro-widget {
          position: fixed;
          bottom: 32px;
          left: 32px;
          width: 300px;
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .pomo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 16px;
        }
        .pomo-title {
          font-weight: 600;
          color: var(--text-main);
        }
        
        .pomo-modes {
          display: flex;
          background-color: var(--bg-hover);
          padding: 4px;
          border-radius: var(--radius-full);
          margin-bottom: 24px;
          width: 100%;
        }
        .mode-btn {
          flex: 1;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .mode-btn.active {
          background-color: var(--bg-card);
          color: var(--text-main);
          box-shadow: var(--shadow-sm);
        }
        
        .pomo-display {
          position: relative;
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .pomo-ring {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          transform: rotate(-90deg);
        }
        .ring-bg {
          fill: none;
          stroke: var(--bg-hover);
          stroke-width: 8;
        }
        .ring-progress {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear, stroke 0.3s;
        }
        .time-text {
          font-size: 42px;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: -2px;
        }
        
        .pomo-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .play-btn {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-md);
        }
        .play-btn:hover {
          transform: scale(1.05);
        }
        .play-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default PomodoroTimer;
