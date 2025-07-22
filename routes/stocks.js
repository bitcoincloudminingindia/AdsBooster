const express = require('express');
const { param, validationResult } = require('express-validator');
const router = express.Router();
const fetch = require('node-fetch');
const logger = require('../logger');

router.get('/price/:symbol',
    param('symbol').isString().isLength({ min: 1, max: 10 }).matches(/^[A-Z0-9.\-]+$/),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const symbol = req.params.symbol;
        const apiKey = process.env.ALPHAVANTAGE_API_KEY;
        try {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            const price = parseFloat(data['Global Quote']?.['05. price']);
            if (!price) return res.status(404).json({ error: 'Price not found' });
            res.json({ symbol, price });
        } catch (err) {
            logger.error('Error in /price/:symbol', err);
            res.status(500).json({ error: 'API error', details: err.message });
        }
    }
);

module.exports = router; 