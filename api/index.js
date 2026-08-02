const { connectDB } = require('../mern-backend/config/db');
const app = require('../mern-backend/server');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
    return app(req, res);
};
