
import { useEffect, useState } from 'react';
import './App.css';

const TASKS_STORAGE_KEY = 'focusflow-tasks';
const GOAL_STORAGE_KEY = 'focusflow-daily-goal';
const FOCUS_STATS_KEY = 'focusflow-stats';
const FOCUS_SECONDS = 25 * 60;

function loadTasks() {
  try {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadDailyGoal() {
  try {
    const saved = Number(localStorage.getItem(GOAL_STORAGE_KEY));
    return saved >= 1 && saved <= 1440 ? saved : 120;
  } catch {
    return 120;
  }
}

function loadFocusStats() {
  try {
    const saved = localStorage.getItem(FOCUS_STATS_KEY);

    if (saved) {
      const stats = JSON.parse(saved);

      if (
        Number.isInteger(stats.sessions) &&
        stats.sessions >= 0 &&
        Number.isInteger(stats.minutes) &&
        stats.minutes >= 0
      ) {
        return stats;
      }
    }
  } catch {
    // Use default statistics if saved data is invalid.
  }

  return { sessions: 0, minutes: 0 };
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [dailyGoal, setDailyGoal] = useState(loadDailyGoal);
  const [focusStats, setFocusStats] = useState(loadFocusStats);

  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [duration, setDuration] = useState('30');

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Save tasks.
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Could not save tasks:', error);
    }
  }, [tasks]);

  // Save the daily goal.
  useEffect(() => {
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, String(dailyGoal));
    } catch (error) {
      console.error('Could not save daily goal:', error);
    }
  }, [dailyGoal]);

  // Save completed focus session statistics.
  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_STATS_KEY, JSON.stringify(focusStats));
    } catch (error) {
      console.error('Could not save focus statistics:', error);
    }
  }, [focusStats]);

  // Run the timer and record a session only when it reaches zero.
  useEffect(() => {
    if (!isRunning) return;

    if (secondsLeft <= 0) {
      setIsRunning(false);
      setSessionComplete(true);

      setFocusStats((currentStats) => ({
        sessions: currentStats.sessions + 1,
        minutes: currentStats.minutes + 25,
      }));

      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isRunning, secondsLeft]);

  function handleAddTask(event) {
    event.preventDefault();

    const trimmedText = taskText.trim();
    const durationNumber = Number(duration);

    if (!trimmedText) return;

    if (
      !Number.isInteger(durationNumber) ||
      durationNumber < 1 ||
      durationNumber > 1440
    ) {
      alert('Enter a duration between 1 and 1440 minutes.');
      return;
    }

    const newTask = {
      id: Date.now(),
      text: trimmedText,
      completed: false,
      priority,
      duration: durationNumber,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);

    setTaskText('');
    setPriority('Medium');
    setDuration('30');
  }

  function handleToggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function handleDeleteTask(id) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    );

    if (String(id) === selectedTaskId) {
      setIsRunning(false);
      setSelectedTaskId('');
      setSecondsLeft(FOCUS_SECONDS);
      setSessionComplete(false);
    }
  }

  function handleSelectTask(event) {
    setIsRunning(false);
    setSessionComplete(false);
    setSecondsLeft(FOCUS_SECONDS);
    setSelectedTaskId(event.target.value);
  }

  function handleStartTimer() {
    if (!selectedTask) {
      alert('Please select a task to focus on first.');
      return;
    }

    if (secondsLeft === 0) {
      alert('Your session has ended. Press Reset to start again.');
      return;
    }

    setSessionComplete(false);
    setIsRunning(true);
  }

  function handlePauseTimer() {
    setIsRunning(false);
  }

  function handleResetTimer() {
    setIsRunning(false);
    setSecondsLeft(FOCUS_SECONDS);
    setSessionComplete(false);
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} min`;

    if (remainingMinutes === 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  }

  function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  }

  const selectedTask = tasks.find(
    (task) => String(task.id) === selectedTaskId
  );

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const remainingTasks = totalTasks - completedTasks;

  const plannedMinutes = tasks.reduce(
    (total, task) => total + task.duration,
    0
  );

  const goalProgress = Math.min(
    (plannedMinutes / dailyGoal) * 100,
    100
  );

  const timerProgress =
    ((FOCUS_SECONDS - secondsLeft) / FOCUS_SECONDS) * 100;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="FocusFlow home">
          <span className="brand-icon">F</span>
          <span>FocusFlow</span>
        </a>

        <span className="topbar-label">YOUR DEEP WORK PLANNER</span>
      </header>

      <section className="welcome-section" id="home">
        <p className="eyebrow">MAKE TODAY COUNT</p>
        <h1 className="design">Plan your focus.</h1>
        <p className="welcome-text">
          Turn your priorities into a plan you can actually follow.
        </p>
      </section>

      <section className="stats-grid" aria-label="Productivity summary">
        <article className="stat-card">
          <p className="stat-label">Total tasks</p>
          <p className="stat-value">{totalTasks}</p>
          <p className="stat-note">Tasks in your plan</p>
        </article>

        <article className="stat-card">
          <p className="stat-label">Completed</p>
          <p className="stat-value">{completedTasks}</p>
          <p className="stat-note">Tasks finished</p>
        </article>

        <article className="stat-card">
          <p className="stat-label">Still to do</p>
          <p className="stat-value">{remainingTasks}</p>
          <p className="stat-note">Tasks remaining</p>
        </article>

        <article className="stat-card">
          <p className="stat-label">Planned focus</p>
          <p className="stat-value">
            {formatDuration(plannedMinutes)}
          </p>
          <p className="stat-note">Estimated task time</p>
        </article>

        <article className="stat-card">
          <p className="stat-label">Focus sessions</p>
          <p className="stat-value">{focusStats.sessions}</p>
          <p className="stat-note">Completed 25-minute sessions</p>
        </article>

        <article className="stat-card">
          <p className="stat-label">Focused time</p>
          <p className="stat-value">
            {formatDuration(focusStats.minutes)}
          </p>
          <p className="stat-note">Time from completed sessions</p>
        </article>
      </section>

      <section className="goal-card">
        <div className="goal-heading">
          <div>
            <p className="eyebrow">YOUR DAILY TARGET</p>
            <h2 className="design" >Make time for focused work</h2>
            <p className="goal-description">
              Set a target and plan tasks to match it.
            </p>
          </div>

          <div className="goal-input-wrap">
            <label htmlFor="daily-goal">Goal (minutes)</label>
            <input
              id="daily-goal"
              type="number"
              min="1"
              max="1440"
              value={dailyGoal}
              onChange={(event) => {
                const value = Number(event.target.value);

                if (
                  Number.isInteger(value) &&
                  value >= 1 &&
                  value <= 1440
                ) {
                  setDailyGoal(value);
                }
              }}
            />
          </div>
        </div>

        <div className="goal-progress-labels">
          <span>{formatDuration(plannedMinutes)} planned</span>
          <span>
            {Math.round((plannedMinutes / dailyGoal) * 100)}% of goal
          </span>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="Planned focus time compared with daily goal"
          aria-valuemin={0}
          aria-valuemax={dailyGoal}
          aria-valuenow={Math.min(plannedMinutes, dailyGoal)}
        >
          <div
            className="progress-fill"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        <p className="goal-footer">
          {plannedMinutes >= dailyGoal
            ? 'Your plan meets your daily focus target!'
            : `${formatDuration(dailyGoal - plannedMinutes)} more to plan to reach your target.`}
        </p>
      </section>

      <section className="timer-card">
        <div className="timer-heading">
          <div>
            <p className="eyebrow">FOCUS TIMER</p>
            <h2 className="design" >One thing at a time.</h2>
          </div>
          <span className="pomodoro-badge">POMODORO</span>
        </div>

        <div className="timer-circle">
          <div
            className="timer-progress"
            style={{
              background: `conic-gradient(#795de8 ${timerProgress}%, #eeecf7 ${timerProgress}% 100%)`,
            }}
          >
            <div className="timer-circle-inner">
              <p className="timer-time">{formatTimer(secondsLeft)}</p>
              <p className="timer-subtitle">
                {sessionComplete
                  ? 'Session complete!'
                  : isRunning
                    ? 'Stay focused'
                    : 'Focus time'}
              </p>
            </div>
          </div>
        </div>

        <div className="form-field timer-task-field">
          <label htmlFor="timer-task">What are you focusing on?</label>
          <select
            id="timer-task"
            value={selectedTaskId}
            onChange={handleSelectTask}
            disabled={isRunning}
          >
            <option value="">Select a task...</option>

            {tasks
              .filter((task) => !task.completed)
              .map((task) => (
                <option key={task.id} value={String(task.id)}>
                  {task.text}
                </option>
              ))}
          </select>
        </div>

        {sessionComplete && (
          <p className="timer-message" role="status">
            🎉 Great work! You completed a 25-minute focus session.
          </p>
        )}

        <div className="timer-controls">
          <button
            className="primary-button timer-button"
            type="button"
            onClick={handleStartTimer}
            disabled={isRunning || secondsLeft === 0}
          >
            ▶ {isRunning ? 'Running...' : 'Start'}
          </button>

          <button
            className="secondary-button timer-button"
            type="button"
            onClick={handlePauseTimer}
            disabled={!isRunning}
          >
            Ⅱ Pause
          </button>

          <button
            className="secondary-button timer-button"
            type="button"
            onClick={handleResetTimer}
          >
            ↻ Reset
          </button>
        </div>

        <p className="timer-hint">
          ✦ Small, focused steps create big results.
        </p>
      </section>

      <section className="workspace">
        <section className="panel add-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">GET IT OUT OF YOUR HEAD</p>
              <h2>Add a task</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <form onSubmit={handleAddTask} className="task-form">
            <div className="form-field">
              <label htmlFor="task-text">
                What do you need to focus on?
              </label>
              <input
                id="task-text"
                type="text"
                placeholder="e.g. Finish React project"
                value={taskText}
                onChange={(event) => setTaskText(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="task-duration">Duration (min)</label>
                <input
                  id="task-duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  required
                />
              </div>
            </div>

            <button className="primary-button" type="submit">
              <span>＋</span> Add to my plan
            </button>
          </form>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-heading tasks-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h2 className="design" >Today's tasks</h2>
            </div>
            <span className="task-count">{remainingTasks} remaining</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h3>A clear mind starts here.</h3>
              <p>
                Add your first task and start building your focus plan.
              </p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article
                  className={`task-item ${
                    task.completed ? 'task-completed' : ''
                  }`}
                  key={task.id}
                >
                  <button
                    className={`completion-button ${
                      task.completed ? 'is-completed' : ''
                    }`}
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? `Mark ${task.text} as incomplete`
                        : `Mark ${task.text} as complete`
                    }
                  >
                    {task.completed ? '✓' : ''}
                  </button>

                  <div className="task-content">
                    <p className="task-title">{task.text}</p>

                    <div className="task-meta">
                      <span
                        className={`priority-badge priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>

                      <span className="duration-badge">
                        ◷ {formatDuration(task.duration)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    aria-label={`Delete ${task.text}`}
                    title="Delete task"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}

          {tasks.length > 0 && (
            <p className="list-footer">
              {completedTasks === totalTasks
                ? 'All tasks completed. Great work!'
                : 'Small, focused steps add up.'}
            </p>
          )}
        </section>
      </section>

      <footer className="app-footer">
        <span>FocusFlow</span>
        <span>Progress over perfection.</span>
      </footer>
    </main>
  );
}

export default App;
