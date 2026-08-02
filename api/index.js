const { connectDB } = require('../mern-backend/config/db');
const app = require('../mern-backend/server');

let isConnected = false;

module.exports = async (req, res) => {
    try {
        if (!isConnected) {
            await connectDB().catch(err => console.log('[DB CONNECT NOTICE]', err.message));
            isConnected = true;
        }
        return app(req, res);
    } catch (err) {
        console.error('[SERVERLESS API ERROR]', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

