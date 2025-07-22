const express = require('express');
const router = express.Router();
const { getProviderStatus, getProxy } = require('../proxyPool'); // Import getProxy
const logger = require('../logger');
const fetch = require('node-fetch');

// Change route from '/proxy-status' to '/'
router.get('/', (req, res) => {
    try {
        // If you add query params in the future, use express-validator here for validation.
        const status = getProviderStatus();
        res.json({ providers: status, timestamp: new Date().toISOString() });
    } catch (err) {
        logger.error('Error in /proxy-status', err);
        res.status(500).json({ error: 'Proxy status error', details: err.message });
    }
});

// Add /test-link endpoint
router.get('/test-link', async (req, res) => {
    const url = req.query.url;
    const country = req.query.country;
    console.log('Frontend se aayi country:', country); // Logging for debug

    if (!url || !country) {
        return res.json({ success: false, error: 'Missing url or country' });
    }

    // Proxy selection logic (dummy for now)
    const proxy = getProxy({ country });
    if (!proxy) {
        return res.json({ success: false, error: 'No proxy available for this country' });
    }

    // TODO: Proxy ke through url ko test karo (abhi dummy response)
    return res.json({ success: true });
});

// Add /fetch endpoint for iframe proxying
router.get('/fetch', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL required');
    try {
        const response = await fetch(url);
        if (!response.ok) return res.status(response.status).send('Failed to fetch');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        response.body.pipe(res);
    } catch (err) {
        res.status(500).send('Proxy fetch error');
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