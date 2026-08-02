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
        try {
            const rows = await Reading.find({ material }).sort({ elapsed_sec: 1 }).lean();
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.error('[REPLAY MONGO ERR]', e);
        }
    }

    const db = getSqliteDb();
    if (db) {
        try {
            const rows = await new Promise((resolve) => {
                db.all("SELECT * FROM readings WHERE material = ? ORDER BY elapsed_sec ASC", [material], (err, rows) => {
                    if (err) return resolve(null);
                    resolve(rows);
                });
            });
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.error('[REPLAY SQLITE ERR]', e);
        }
    }

    const mat = (material || 'soil').toLowerCase();
    const { generateMaterialRows } = require('../utils/seedMongo');
    if (mat === "sand") return generateMaterialRows("sand", 1800, 1100, 1500);
    if (mat === "coal") return generateMaterialRows("coal", 3600, 2500, 3100);
    return generateMaterialRows("soil", 2760, 1800, 2400);
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
