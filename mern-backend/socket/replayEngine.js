const Reading = require('../models/Reading');
const { isMongoConnected, getSqliteDb } = require('../config/db');

const activeSessions = new Map();

function startSession(io, socketId, material = "soil", speed = 5) {
    stopSession(socketId);

    const sessionState = {
        running: true,
        speed: parseFloat(speed) > 0 ? parseFloat(speed) : 1.0,
        material: material.toLowerCase()
    };

    activeSessions.set(socketId, sessionState);

    // Notify mode status
    io.to(socketId).emit("mode_status", { mode: "replay", material, speed: sessionState.speed });

    // Run replay loop
    runReplayLoop(io, socketId, sessionState);
}

function stopSession(socketId) {
    if (activeSessions.has(socketId)) {
        console.log(`[REPLAY] Stopping Node.js replay loop for socket ${socketId}`);
        const state = activeSessions.get(socketId);
        state.running = false;
        activeSessions.delete(socketId);
    }
}

function updateSpeed(socketId, newSpeed) {
    if (activeSessions.has(socketId)) {
        const speed = parseFloat(newSpeed);
        if (speed > 0) {
            console.log(`[REPLAY] Updating speed for socket ${socketId} to ${speed}x`);
            activeSessions.get(socketId).speed = speed;
        }
    }
}

async function fetchReadings(material) {
    if (isMongoConnected()) {
        return await Reading.find({ material }).sort({ elapsed_sec: 1 }).lean();
    }

    const db = getSqliteDb();
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM readings WHERE material = ? ORDER BY elapsed_sec ASC", [material], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function runReplayLoop(io, socketId, sessionState) {
    try {
        const readings = await fetchReadings(sessionState.material);
        if (!readings || readings.length === 0) {
            io.to(socketId).emit("mode_status", { mode: "replay", material: sessionState.material, status: "no_data" });
            return;
        }

        console.log(`[REPLAY LOOP START] Socket: ${socketId}, Material: ${sessionState.material}, Total rows: ${readings.length}`);

        for (const row of readings) {
            if (!sessionState.running) {
                console.log(`[REPLAY LOOP STOPPED] Socket: ${socketId}`);
                break;
            }

            io.to(socketId).emit("reading", row);

            const currSpeed = sessionState.speed || 1.0;
            const sleepMs = Math.max(10, Math.round(2000 / currSpeed));
            await new Promise(resolve => setTimeout(resolve, sleepMs));
        }

        if (sessionState.running) {
            console.log(`[REPLAY LOOP COMPLETE] Socket: ${socketId}`);
            io.to(socketId).emit("replay_complete", { material: sessionState.material });
        }
    } catch (err) {
        console.error(`[REPLAY LOOP ERROR] Socket: ${socketId}:`, err);
    } finally {
        activeSessions.delete(socketId);
    }
}

module.exports = {
    startSession,
    stopSession,
    updateSpeed
};
