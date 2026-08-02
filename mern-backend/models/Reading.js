const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
    timestamp: { type: String, required: true },
    elapsed_sec: { type: Number, required: true, index: true },
    material: { type: String, required: true, index: true },
    roll_deg: { type: Number, default: 0 },
    pitch_deg: { type: Number, default: 0 },
    moisture_pct: { type: Number, default: 0 },
    pressure_kpa: { type: Number, default: 0 },
    vibration_adc: { type: Number, default: 0 },
    status: { type: String, default: "SAFE" },
    risk_level: { type: Number, default: 0 }
}, {
    timestamps: true
});

ReadingSchema.index({ material: 1, elapsed_sec: 1 });

module.exports = mongoose.model('Reading', ReadingSchema);
