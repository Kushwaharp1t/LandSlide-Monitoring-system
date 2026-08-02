/**
 * Risk Assessment Rules Engine
 * 
 * Rules:
 * - LANDSLIDE RISK (2): |roll| > 35 or |pitch| > 35 or moisture > 85 or pressure > 160 or vibration > 25000
 * - WARNING (1): |roll| > 20 or |pitch| > 20 or moisture > 70 or pressure > 120 or vibration > 20000
 * - SAFE (0): Default
 */

function assessRisk(roll, pitch, moisture, pressure, vibration) {
    const rollAbs = Math.abs(roll || 0);
    const pitchAbs = Math.abs(pitch || 0);
    const moistureVal = moisture || 0;
    const pressureVal = pressure || 0;
    const vibrationVal = vibration || 0;

    if (rollAbs > 35 || pitchAbs > 35 || moistureVal > 85 || pressureVal > 160 || vibrationVal > 25000) {
        return { status: "LANDSLIDE RISK", riskLevel: 2 };
    }

    if (rollAbs > 20 || pitchAbs > 20 || moistureVal > 70 || pressureVal > 120 || vibrationVal > 20000) {
        return { status: "WARNING", riskLevel: 1 };
    }

    return { status: "SAFE", riskLevel: 0 };
}

module.exports = { assessRisk };
