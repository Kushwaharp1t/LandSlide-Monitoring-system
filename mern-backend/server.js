const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const { startSession, stopSession, updateSpeed } = require('./socket/replayEngine');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes MUST be mounted BEFORE static files and wildcard routes
app.use('/api', apiRoutes);

// Serve frontend build if present
const frontendBuild = path.join(__dirname, '..', 'mern-frontend', 'dist');
app.use(express.static(frontendBuild));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
});

// Socket.IO Events
io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.emit('mode_status', { mode: 'replay', material: 'soil', speed: 1.0 });

    socket.on('start_replay', (data = {}) => {
        const material = data.material || 'soil';
        const speed = data.speed || 5;
        startSession(io, socket.id, material, speed);
    });

    socket.on('stop_replay', () => {
        stopSession(socket.id);
        socket.emit('mode_status', { mode: 'replay', material: 'soil', status: 'stopped' });
    });

    socket.on('set_speed', (data = {}) => {
        if (data.speed) {
            updateSpeed(socket.id, data.speed);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`);
        stopSession(socket.id);
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`[MERN SERVER] Landslide Monitoring API listening on http://0.0.0.0:${PORT}`);
    });
}

if (require.main === module) {
    startServer();
}

module.exports = app;


