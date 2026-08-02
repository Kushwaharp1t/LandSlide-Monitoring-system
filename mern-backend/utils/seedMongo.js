/**
 * MongoDB Data Seeder
 * Populates 4,083 sensor records into MongoDB for Soil, Sand, and Coal.
 */

const mongoose = require('mongoose');
const Reading = require('../models/Reading');
const { assessRisk } = require('./risk');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/landslide_db';

function generateMaterialRows(materialName, totalDurationSec, warnStartSec, dangerStartSec) {
    const rows = [];
    const baseDate = new Date(Date.now() - totalDurationSec * 1000);

    let baseMoisture = 32.0, maxMoisture = 88.5, basePressure = 45.0, maxPressure = 175.0;
    if (materialName === "sand") {
        baseMoisture = 18.0; maxMoisture = 87.0; basePressure = 35.0; maxPressure = 168.0;
    } else if (materialName === "coal") {
        baseMoisture = 28.0; maxMoisture = 89.0; basePressure = 40.0; maxPressure = 182.0;
    }

    for (let elapsed = 0; elapsed <= totalDurationSec; elapsed += 2) {
        const rowTime = new Date(baseDate.getTime() + elapsed * 1000).toISOString().replace('T', ' ').substring(0, 19);

        let roll, pitch, moisture, pressure, vibration;

        if (elapsed < warnStartSec) {
            const ratio = elapsed / warnStartSec;
            roll = (Math.random() * 8 - 4) + (ratio * 12);
            pitch = (Math.random() * 8 - 4) + (ratio * 10);
            moisture = baseMoisture + (ratio * (65 - baseMoisture)) + (Math.random() * 2 - 1);
            pressure = basePressure + (ratio * (110 - basePressure)) + (Math.random() * 4 - 2);
            vibration = Math.floor(1500 + Math.random() * 6500);
        } else if (elapsed < dangerStartSec) {
            const ratio = (elapsed - warnStartSec) / (dangerStartSec - warnStartSec);
            roll = 21 + (ratio * 12) + (Math.random() * 4 - 2);
            pitch = 18 + (ratio * 12) + (Math.random() * 4 - 2);
            moisture = 71 + (ratio * 13) + (Math.random() * 1.6 - 0.8);
            pressure = 122 + (ratio * 35) + (Math.random() * 5 - 2.5);
            vibration = Math.floor(20500 + (ratio * 4000) + (Math.random() * 1000 - 500));
        } else {
            const ratio = (elapsed - dangerStartSec) / Math.max(1, totalDurationSec - dangerStartSec);
            roll = 36 + (ratio * 20) + (Math.random() * 6 - 3);
            pitch = 34 + (ratio * 18) + (Math.random() * 6 - 3);
            moisture = 86 + (ratio * (maxMoisture - 86)) + (Math.random() * 1 - 0.5);
            pressure = 162 + (ratio * (maxPressure - 162)) + (Math.random() * 6 - 3);
            vibration = Math.floor(25500 + (ratio * 6000) + (Math.random() * 2000 - 1000));
        }

        roll = Number(roll.toFixed(2));
        pitch = Number(pitch.toFixed(2));
        moisture = Number(Math.max(0, Math.min(100, moisture)).toFixed(2));
        pressure = Number(Math.max(0, pressure).toFixed(2));
        vibration = Math.max(0, Math.min(32767, vibration));

        const { status, riskLevel } = assessRisk(roll, pitch, moisture, pressure, vibration);

        rows.push({
            timestamp: rowTime,
            elapsed_sec: elapsed,
            material: materialName,
            roll_deg: roll,
            pitch_deg: pitch,
            moisture_pct: moisture,
            pressure_kpa: pressure,
            vibration_adc: vibration,
            status,
            risk_level: riskLevel
        });
    }

    return rows;
}

async function seedData() {
    try {
        console.log(`[SEED] Connecting to MongoDB: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        
        await Reading.deleteMany({});
        console.log('[SEED] Cleared existing Reading collection');

        const soilRows = generateMaterialRows("soil", 2760, 1800, 2400);
        const sandRows = generateMaterialRows("sand", 1800, 1100, 1500);
        const coalRows = generateMaterialRows("coal", 3600, 2500, 3100);

        const allRows = [...soilRows, ...sandRows, ...coalRows];

        await Reading.insertMany(allRows);
        console.log(`[SEED SUCCESS] Inserted ${allRows.length} documents into MongoDB (Soil: ${soilRows.length}, Sand: ${sandRows.length}, Coal: ${coalRows.length})`);

        process.exit(0);
    } catch (err) {
        console.error('[SEED ERROR]', err);
        process.exit(1);
    }
}

if (require.main === module) {
    seedData();
}

module.exports = { generateMaterialRows };
