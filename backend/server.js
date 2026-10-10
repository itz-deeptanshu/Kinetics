/**
 * Sample local backend API server for Daily Habit & Nutrition Tracker.
 * Runs on http://localhost:5000
 *
 * Endpoints:
 * - GET  /api/logs/:date -> returns log object for date (YYYY-MM-DD)
 * - POST /api/logs       -> saves log object { date, gym, running, coding, studying, extraWork, protein, calories }
 * - GET  /api/logs       -> returns all stored logs (or date range)
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
// Set DATA_FILE to a path on a persistent disk/volume when deploying
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'logs_data.json');

// Enable CORS for all origins (needed for local development from localhost:3000)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// In-memory / file-backed database of logs keyed by YYYY-MM-DD
let logsDb = {};

// Load existing data if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    logsDb = JSON.parse(raw);
    console.log(`Loaded ${Object.keys(logsDb).length} logs from ${DATA_FILE}`);
  }
} catch (err) {
  console.warn('Could not read logs_data.json, starting with empty database', err.message);
}

// Write to a temp file, then rename, so a crash can't leave a half-written file
function saveDb() {
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(logsDb, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.error('Failed to save logs to file', err.message);
  }
}

// True only for real calendar dates like 2026-09-30 (rejects "hello" and 2026-02-31)
function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

// Today's date in local time (used only for the startup message)
const todayStr = new Date().toLocaleDateString('en-CA');

// GET /api/logs/:date
app.get('/api/logs/:date', (req, res) => {
  const date = req.params.date;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Date must be a valid YYYY-MM-DD string' });
  }
  const log = logsDb[date] || {
    date,
    gym: false,
    running: false,
    coding: false,
    studying: false,
    extraWork: false,
    protein: 0,
    calories: 0,
    notes: '',
    isNew: true,
  };

  // Calculate current week counts for Gym and Running
  const targetDate = new Date(date + 'T12:00:00Z');
  const dayOfWeek = targetDate.getUTCDay(); // 0 is Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(targetDate);
  monday.setUTCDate(targetDate.getUTCDate() + mondayOffset);

  let gymCount = 0;
  let runningCount = 0;
  const weekLogs = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const entry = logsDb[dStr];
    if (entry) {
      if (entry.gym) gymCount++;
      if (entry.running) runningCount++;
      weekLogs[dStr] = entry;
    }
  }

  res.json({
    ...log,
    weeklyStats: {
      gymCount,
      runningCount,
      gymTarget: 4,
      runningTarget: 3,
      weekLogs,
    },
  });
});

// POST /api/logs
app.post('/api/logs', (req, res) => {
  const { date, gym, running, coding, studying, extraWork, extra_work, protein, calories, notes } = req.body;

  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Date is required and must be a valid YYYY-MM-DD string' });
  }

  const updatedLog = {
    date,
    gym: Boolean(gym),
    running: Boolean(running),
    coding: Boolean(coding),
    studying: Boolean(studying),
    extraWork: Boolean(extraWork ?? extra_work),
    protein: Number(protein) || 0,
    calories: Number(calories) || 0,
    notes: typeof notes === 'string' ? notes : (notes != null ? String(notes) : ''),
    updatedAt: new Date().toISOString(),
  };

  logsDb[date] = updatedLog;
  saveDb();

  // Recalculate weekly stats for the saved date
  const targetDate = new Date(date + 'T12:00:00Z');
  const dayOfWeek = targetDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(targetDate);
  monday.setUTCDate(targetDate.getUTCDate() + mondayOffset);

  let gymCount = 0;
  let runningCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const entry = logsDb[dStr];
    if (entry) {
      if (entry.gym) gymCount++;
      if (entry.running) runningCount++;
    }
  }

  res.json({
    success: true,
    data: updatedLog,
    weeklyStats: {
      gymCount,
      runningCount,
      gymTarget: 4,
      runningTarget: 3,
    },
  });
});

// GET /api/logs (returns all logs or range)
app.get('/api/logs', (req, res) => {
  res.json({ logs: logsDb });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/logs/${todayStr}`);
});