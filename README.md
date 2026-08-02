# 🏔️ Landslide Detection & Monitoring System — MERN Stack

[![Node.js](https://img.shields.io/badge/Node.js-v20+-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19+-informational.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React.js-18.3+-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-black.svg)](https://socket.io/)

A full-stack **MERN** (MongoDB / SQLite Fallback, Express, React 18, Node.js) IoT telemetry dashboard and early warning monitoring system for real-time slope stability assessment.

---

## 🏗️ Architecture

```
 ┌───────────────────────────┐
 │ MongoDB / SQLite Fallback │─────┐
 └───────────────────────────┘     │
                                   ├──► [ Express + Socket.IO Server ] ──► [ React 18 + Vite Frontend ]
 ┌───────────────────────────┐     │    (Node.js Replay Loop)               (Chart.js Gauges & Waveforms)
 │ Sensor Telemetry Streams  │─────┘
 └───────────────────────────┘
```

- **Database Layer (`mern-backend/models/Reading.js`)**: Mongoose schema storing sensor telemetry (Roll, Pitch, Moisture, Pressure, Vibration, Status, Risk Level), with automatic SQLite fallback when MongoDB is not connected.
- **Express + Socket.IO Server (`mern-backend/server.js`)**: Real-time Node.js replay loop streaming readings at 1x, 5x, and 20x speeds.
- **React Frontend (`mern-frontend/`)**: Modular React 18 application built with Vite and `react-chartjs-2`.

---

## 🚀 How to Run

### 1. Install & Build Frontend (Production build served by backend)
```bash
cd mern-frontend
npm install
npm run build
```

### 2. Install & Start Backend
```bash
cd mern-backend
npm install
npm start
```
Open **`http://localhost:5000`** in your browser.

---

## 🔌 REST API & WebSocket Events

### REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/materials` | List available materials (`["soil", "sand", "coal"]`) |
| `GET` | `/api/readings?material=soil&limit=500` | Fetch sensor readings range |
| `GET` | `/api/summary?material=soil` | Geotechnical summary stats for a single material |
| `GET` | `/api/summary/all` | Summary stats across all materials |
| `GET` | `/api/health` | Uptime & DB health check (`{"status": "ok"}`) |

### Socket.IO WebSocket Events

- `start_replay` — `{ material: "soil", speed: 5 }` — Starts background session streaming.
- `stop_replay` — `{}` — Terminates active streaming session.
- `set_speed` — `{ speed: 20 }` — Dynamically updates playback multiplier mid-stream.
- `reading` — Pushes individual sensor telemetry payload to client.

