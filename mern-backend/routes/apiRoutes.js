const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');
const { isMongoConnected, getSqliteDb } = require('../config/db');
const { generateMaterialRows } = require('../utils/seedMongo');

function getInMemoryRows(material) {
    const mat = (material || 'soil').toLowerCase();
    if (mat === 'sand') return generateMaterialRows('sand', 1800, 1100, 1500);
    if (mat === 'coal') return generateMaterialRows('coal', 3600, 2500, 3100);
    return generateMaterialRows('soil', 2760, 1800, 2400);
}

function computeSummaryFromRows(material, rows) {
    if (!rows || rows.length === 0) return null;
    const first10 = rows.slice(0, 10);
    const last1 = rows[rows.length - 1];
    const maxVibe = Math.max(...rows.map(r => r.vibration_adc || 0));
    const totalDuration = last1.elapsed_sec;

    const baseMoisture = first10.reduce((acc, r) => acc + (r.moisture_pct || 0), 0) / (first10.length || 1);
    const basePressure = first10.reduce((acc, r) => acc + (r.pressure_kpa || 0), 0) / (first10.length || 1);

    const warnRow = rows.find(r => (r.risk_level || 0) >= 1);
    const dangerRow = rows.find(r => (r.risk_level || 0) === 2);

    return {
        material,
        total_duration_sec: totalDuration,
        baseline_moisture: Number(baseMoisture.toFixed(1)),
        failure_moisture: Number((last1.moisture_pct || 0).toFixed(1)),
        baseline_pressure: Number(basePressure.toFixed(1)),
        failure_pressure: Number((last1.pressure_kpa || 0).toFixed(1)),
        time_to_warning_sec: warnRow ? warnRow.elapsed_sec : null,
        time_to_danger_sec: dangerRow ? dangerRow.elapsed_sec : null,
        max_vibration: maxVibe
    };
}

// GET /api/health
router.get('/health', (req, res) => {
    res.json({ status: "ok", db: isMongoConnected() ? "MongoDB" : (getSqliteDb() ? "SQLite" : "InMemory Fallback") });
});

// GET /api/materials
router.get('/materials', async (req, res) => {
    res.json(["coal", "sand", "soil"]);
});

// GET /api/readings?material=soil&limit=500
router.get('/readings', async (req, res) => {
    const material = (req.query.material || 'soil').toLowerCase();
    const limit = parseInt(req.query.limit) || 500;

    try {
        if (isMongoConnected()) {
            const readings = await Reading.find({ material })
                .sort({ elapsed_sec: 1 })
                .limit(limit)
                .lean();
            if (readings && readings.length > 0) {
                return res.json(readings);
            }
        }

        const db = getSqliteDb();
        if (db) {
            db.all(
                "SELECT timestamp, elapsed_sec, material, roll_deg, pitch_deg, moisture_pct, pressure_kpa, vibration_adc, status, risk_level FROM readings WHERE material = ? ORDER BY elapsed_sec ASC LIMIT ?",
                [material, limit],
                (err, rows) => {
                    if (!err && rows && rows.length > 0) {
                        return res.json(rows);
                    }
                    const fallback = getInMemoryRows(material).slice(0, limit);
                    return res.json(fallback);
                }
            );
            return;
        }

        const fallback = getInMemoryRows(material).slice(0, limit);
        return res.json(fallback);
    } catch (err) {
        const fallback = getInMemoryRows(material).slice(0, limit);
        return res.json(fallback);
    }
});

// GET /api/summary/all (MUST BE PLACED BEFORE /api/summary)
router.get('/summary/all', async (req, res) => {
    try {
        const materials = ["soil", "sand", "coal"];
        const results = {};
        for (const mat of materials) {
            const summary = await calculateSummary(mat);
            if (summary) results[mat] = summary;
        }
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/summary?material=soil
router.get('/summary', async (req, res) => {
    const material = (req.query.material || 'soil').toLowerCase();
    try {
        const summary = await calculateSummary(material);
        if (!summary) return res.status(404).json({ error: `Material '${material}' not found` });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function calculateSummary(material) {
    if (isMongoConnected()) {
        try {
            const count = await Reading.countDocuments({ material });
            if (count > 0) {
                const first10 = await Reading.find({ material }).sort({ elapsed_sec: 1 }).limit(10).lean();
                const last1 = await Reading.find({ material }).sort({ elapsed_sec: -1 }).limit(1).lean();
                const maxVibeDoc = await Reading.find({ material }).sort({ vibration_adc: -1 }).limit(1).lean();
                const maxDurationDoc = await Reading.find({ material }).sort({ elapsed_sec: -1 }).limit(1).lean();
                const firstWarn = await Reading.find({ material, risk_level: { $gte: 1 } }).sort({ elapsed_sec: 1 }).limit(1).lean();
                const firstDanger = await Reading.find({ material, risk_level: 2 }).sort({ elapsed_sec: 1 }).limit(1).lean();

                const baseMoisture = first10.reduce((acc, curr) => acc + curr.moisture_pct, 0) / (first10.length || 1);
                const basePressure = first10.reduce((acc, curr) => acc + curr.pressure_kpa, 0) / (first10.length || 1);

                return {
                    material,
                    total_duration_sec: maxDurationDoc[0]?.elapsed_sec || 0,
                    baseline_moisture: Number(baseMoisture.toFixed(1)),
                    failure_moisture: Number((last1[0]?.moisture_pct || 0).toFixed(1)),
                    baseline_pressure: Number(basePressure.toFixed(1)),
                    failure_pressure: Number((last1[0]?.pressure_kpa || 0).toFixed(1)),
                    time_to_warning_sec: firstWarn[0]?.elapsed_sec || null,
                    time_to_danger_sec: firstDanger[0]?.elapsed_sec || null,
                    max_vibration: maxVibeDoc[0]?.vibration_adc || 0
                };
            }
        } catch (e) {
            console.error('[DB MONGO SUMMARY ERR]', e);
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
            if (rows && rows.length > 0) {
                return computeSummaryFromRows(material, rows);
            }
        } catch (e) {
            console.error('[DB SQLITE SUMMARY ERR]', e);
        }
    }

    const inMemoryRows = getInMemoryRows(material);
    return computeSummaryFromRows(material, inMemoryRows);
}

module.exports = router;

