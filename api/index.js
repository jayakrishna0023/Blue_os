// Vercel Serverless Function Entry Point
const app = require('../server/index');

// Export as a serverless function handler
module.exports = (req, res) => {
    // Vercel strips the /api prefix, but Express routes expect it
    // So we need to add it back if missing
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + req.url;
    }
    return app(req, res);
};