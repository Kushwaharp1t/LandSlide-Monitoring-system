const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let sqlite3 = null;
try {
    sqlite3 = require('sqlite3').verbose();
} catch (e) {
    console.log('[DB NOTICE] sqlite3 native module not available in this environment:', e.message);
}

let useMongo = false;
let sqliteDb = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/landslide_db';
const SQLITE_PATH = path.join(__dirname, '..', 'readings.db');

async function connectDB() {
    try {
        console.log('[DB] Attempting MongoDB connection via Mongoose...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 2000
        });
        useMongo = true;
        console.log(`[DB SUCCESS] Connected to MongoDB at ${MONGODB_URI}`);
    } catch (err) {
        console.log(`[DB NOTICE] MongoDB connection timeout/unavailable: ${err.message}`);
        useMongo = false;
        
        if (sqlite3) {
            console.log(`[DB FALLBACK] Switching to SQLite database engine at ${SQLITE_PATH}...`);
            try {
                sqliteDb = new sqlite3.Database(SQLITE_PATH, (sqliteErr) => {
                    if (sqliteErr) {
                        console.error(`[DB ERROR] Failed to connect to SQLite: ${sqliteErr.message}`);
                    } else {
                        console.log('[DB SUCCESS] Connected to SQLite database fallback engine.');
                        initSqliteDb(sqliteDb);
                    }
                });
            } catch (e) {
                console.error('[DB ERROR] SQLite database initialization failed:', e.message);
            }
        } else {
            console.log('[DB NOTICE] Operating in high-speed In-Memory telemetry mode.');
        }
    }
}


function initSqliteDb(db) {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                elapsed_sec INTEGER NOT NULL,
                material TEXT NOT NULL,
                roll_deg REAL,
                pitch_deg REAL,
                moisture_pct REAL,
                pressure_kpa REAL,
                vibration_adc INTEGER,
                status TEXT,
                risk_level INTEGER
            )
        `);
        db.run(`CREATE INDEX IF NOT EXISTS idx_material_elapsed ON readings(material, elapsed_sec)`);

        db.get("SELECT COUNT(*) as count FROM readings", [], (err, row) => {
            if (!err && row && row.count === 0) {
                console.log("[DB SEED] SQLite database empty. Auto-seeding fallback sensor records...");
                const { generateMaterialRows } = require('../utils/seedMongo');
                const soil = generateMaterialRows("soil", 2760, 1800, 2400);
                const sand = generateMaterialRows("sand", 1800, 1100, 1500);
                const coal = generateMaterialRows("coal", 3600, 2500, 3100);
                const allRows = [...soil, ...sand, ...coal];

                const stmt = db.prepare(`
                    INSERT INTO readings (timestamp, elapsed_sec, material, roll_deg, pitch_deg, moisture_pct, pressure_kpa, vibration_adc, status, risk_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                db.serialize(() => {
                    for (const r of allRows) {
                        stmt.run([r.timestamp, r.elapsed_sec, r.material, r.roll_deg, r.pitch_deg, r.moisture_pct, r.pressure_kpa, r.vibration_adc, r.status, r.risk_level]);
                    }
                    stmt.finalize();
                    console.log(`[DB SEED SUCCESS] Auto-seeded ${allRows.length} records into SQLite fallback database.`);
                });
            }
        });
    });
}

function isMongoConnected() {
    return useMongo;
}

function getSqliteDb() {
    return sqliteDb;
}

module.exports = {
    connectDB,
    isMongoConnected,
    getSqliteDb
};

