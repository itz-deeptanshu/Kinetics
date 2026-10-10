# Kinetics
# Daily Habit & Nutrition Tracker

A clean, minimalist single-page dashboard for tracking daily habits and nutrition, with weekly target streaks. It talks to a small local Express backend that stores everything in a JSON file, and falls back to browser storage when the backend is offline.

<!-- Add a screenshot: save it as docs/screenshot.png and uncomment the line below -->
<!-- ![App screenshot](docs/screenshot.png) -->

## Features

- **Daily habit checklist:** gym, running, coding, studying and extra work
- **Weekly targets:** gym 4x/week and running 3x/week, with live progress and a day-by-day week strip
- **Nutrition tracking:** protein (target 100 g or more) and calories against an adjustable daily limit (default 2000 kcal), with progress bars
- **Date navigation:** previous/next day buttons, a date picker and a "jump to today" button, limited to a 3-month window either side of today
- **Autosave:** changes save automatically a moment after you stop editing, or manually with **Save Day**
- **Offline fallback:** every save is also cached in `localStorage`, so the app keeps working without the backend
- **Configurable API URL:** point the frontend at any backend from the in-app settings
- **Safe reset:** **Reset Day** asks for a second click to confirm

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | Vanilla JavaScript in a single `index.html`, Tailwind CSS (CDN), Google Fonts, served by Vite |
| Backend | Node.js, Express |
| Storage | Local JSON file (`backend/logs_data.json`) plus browser `localStorage` cache |

## Project structure

```
.
├── backend/
│   └── server.js        # Express API, stores data in logs_data.json
│   └── logs_data.json   # Saves daily input in a json format
├── src/                 # Vite/React scaffold (not used by the app UI)
├── index.html           # The whole app: markup, styles and logic
├── vite.config.ts       # Dev server config
└── package.json
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) LTS (includes npm)

### Install

```bash
git clone <your-repo-url>
cd <your-repo-folder>
npm install
```

> **Windows users:** keep the folder name plain, with no `&`, spaces or brackets. A folder name like `daily-habit-&-nutrition-tracker` breaks npm scripts, because `cmd.exe` treats `&` as a command separator.

### Run

Start the backend and the frontend in two separate terminals, both in the project folder.

```bash
# Terminal 1: API on http://localhost:5000
npm run backend
```

```bash
# Terminal 2: app on http://localhost:3000
npm run dev
```

Open <http://localhost:3000>. The status dot in the header turns green when the backend is connected, and amber when the app is running from browser storage only.

The frontend loads Tailwind and fonts from CDNs, so you need an internet connection for it to look right.

## API

Base URL: `http://localhost:5000`

### `GET /api/logs/:date`

Returns the log for a date (`YYYY-MM-DD`). If nothing is saved yet, it returns a blank entry with `"isNew": true`. The response also includes `weeklyStats` for that Monday-to-Sunday week.

```json
{
  "date": "2026-10-01",
  "gym": true,
  "running": false,
  "coding": true,
  "studying": false,
  "extraWork": false,
  "protein": 110,
  "calories": 2200,
  "weeklyStats": {
    "gymCount": 2,
    "runningCount": 1,
    "gymTarget": 4,
    "runningTarget": 3
  }
}
```

### `POST /api/logs`

Saves or overwrites the log for a date. Send the full day in the body:

```json
{
  "date": "2026-10-01",
  "gym": true,
  "running": false,
  "coding": true,
  "studying": false,
  "extraWork": false,
  "protein": 110,
  "calories": 2200
}
```

Returns `{ "success": true, "data": { ... }, "weeklyStats": { ... } }`. An invalid or missing `date` returns `400`.

### `GET /api/logs`

Returns every stored log as `{ "logs": { "<date>": { ... } } }`.

## Data

All data is stored in `backend/logs_data.json`, which is created the first time you save a day.

- **Back it up:** copy that file now and then, since it is the only copy of your history.
- **Keep it private:** add `backend/logs_data.json` to `.gitignore` before you push, so your personal logs don't end up on GitHub.
- **Offline entries:** if you save while the backend is off, the entry lives only in your browser until you save that day again with the backend running.

## Configuration

| Setting | Where | Default |
| --- | --- | --- |
| API base URL | In-app settings (stored in `localStorage`) | `http://localhost:5000` |
| Backend port | `PORT` environment variable | `5000` |
| Calorie limit | In-app field (stored in `localStorage`) | `2000` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the frontend dev server on port 3000 |
| `npm run backend` | Start the Express API on port 5000 |
| `npm run build` | Build the frontend with Vite |
| `npm run preview` | Preview the production build |
