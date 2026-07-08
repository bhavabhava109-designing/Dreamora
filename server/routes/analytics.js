import express from 'express';
import Session from '../models/Session.js';
import Task from '../models/Task.js';
import { SessionDb, TaskDb } from '../config/jsonDb.js';
import { getUseJsonDb } from '../config/db.js';

const router = express.Router();

// Post a new completed focus/break session
router.post('/session', async (req, res) => {
  try {
    const { userId, duration, type, roomName } = req.body;
    const sessionData = {
      userId: userId || 'anonymous',
      duration: Number(duration),
      type: type || 'focus',
      roomName: roomName || 'Solo Space'
    };

    let newSession;
    if (getUseJsonDb()) {
      newSession = await SessionDb.create(sessionData);
    } else {
      newSession = new Session(sessionData);
      await newSession.save();
    }
    res.status(201).json(newSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get summarized analytics statistics
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    let sessions;
    let tasks;

    if (getUseJsonDb()) {
      sessions = await SessionDb.find({ userId });
      tasks = await TaskDb.find({ userId });
    } else {
      sessions = await Session.find({ userId });
      tasks = await Task.find({ userId });
    }

    // Filter focus sessions (exclude breaks for focusing trends)
    const focusSessions = sessions.filter(s => s.type === 'focus');

    // Aggregate key stats
    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);
    const completedTasksCount = tasks.filter(t => t.completed).length;
    const totalTasksCount = tasks.length;
    const totalSessions = focusSessions.length;

    // Room Distribution: { 'Silent Library': 120, 'Cosy Cafe': 50 }
    const roomDistribution = {};
    focusSessions.forEach(s => {
      const room = s.roomName || 'Solo Space';
      roomDistribution[room] = (roomDistribution[room] || 0) + s.duration;
    });

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (dateInput) => {
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Daily focus hours for last 7 days (including today)
    const dailyTrend = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = getLocalDateString(date);
      
      const dayMinutes = focusSessions
        .filter(s => {
          const sDateStr = getLocalDateString(s.createdAt);
          return sDateStr === dateStr;
        })
        .reduce((sum, s) => sum + s.duration, 0);

      // Convert to hours with 1 decimal place
      const hours = parseFloat((dayMinutes / 60).toFixed(1));
      
      // Weekday label
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      dailyTrend.push({ date: dateStr, name: weekday, hours });
    }

    // Calculate streak
    let streak = 0;
    const sessionDates = new Set(
      focusSessions.map(s => getLocalDateString(s.createdAt))
    );

    const todayStr = getLocalDateString(now);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const hasToday = sessionDates.has(todayStr);
    const hasYesterday = sessionDates.has(yesterdayStr);

    if (hasToday || hasYesterday) {
      let tempDate = hasToday ? new Date() : yesterday;
      while (true) {
        const tempDateStr = getLocalDateString(tempDate);
        if (sessionDates.has(tempDateStr)) {
          streak++;
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const roomStats = Object.keys(roomDistribution).map(name => ({
      name,
      value: roomDistribution[name]
    }));

    res.json({
      totalFocusMinutes,
      completedTasksCount,
      totalTasksCount,
      totalSessions,
      streak,
      dailyTrend,
      roomStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
