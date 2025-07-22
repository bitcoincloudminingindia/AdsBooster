const express = require('express');
const router = express.Router();
const { getProviderStatus } = require('../proxyPool');
const logger = require('../logger');
const fetch = require('node-fetch');

// Change route from '/proxy-status' to '/'
router.get('/', (req, res) => {
    try {
        // If you add query params in the future, use express-validator here for validation.
        const status = getProviderStatus();
        res.json({ status, timestamp: new Date().toISOString() });
    } catch (err) {
        logger.error('Error in /proxy-status', err);
        res.status(500).json({ error: 'Proxy status error', details: err.message });
    }
});

// Image proxy for downloading/displaying content
router.get('/image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('Image URL required');

        const response = await fetch(imageUrl);
        if (!response.ok) return res.status(response.status).send('Failed to fetch image');

        // Set Content-Type from the source response
        res.setHeader('Content-Type', response.headers.get('content-type'));

        // Force download only if 'download=true' is specified
        if (req.query.download === 'true') {
            const filename = req.query.filename || 'thumbnail.jpg';
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        }

        response.body.pipe(res);
    } catch (err) {
        logger.error('Error in /image proxy', err);
        res.status(500).send('Image proxy error');
    }
});

module.exports = router; 