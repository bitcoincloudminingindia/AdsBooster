const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { groqTextCompletion } = require('./ai');

// 1. Adult Ad Checker
router.post('/adult-ad-checker', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const prompt = `You are an ad compliance expert. Analyze this ad or URL for adult, scam, or risky content. Reply with a clear verdict and reason. URL: ${url}`;
    try {
        const result = await groqTextCompletion(prompt);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI error', details: err.message });
    }
});

// 2. Adult CPM Estimator
router.post('/adult-cpm-estimator', async (req, res) => {
    const { country, trafficType } = req.body;
    if (!country || !trafficType) return res.status(400).json({ error: 'Country and trafficType are required' });
    const prompt = `You are an ad monetization expert. Estimate the CPM for adult ad traffic in ${country} (${trafficType}). Give a realistic CPM range in USD and a short explanation.`;
    try {
        const result = await groqTextCompletion(prompt);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI error', details: err.message });
    }
});

// 3. Adult Landing Checker
router.post('/adult-landing-checker', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const prompt = `You are an ad compliance expert. Analyze this landing page URL for adult or risky content. Reply with a clear verdict and reason. URL: ${url}`;
    try {
        const result = await groqTextCompletion(prompt);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI error', details: err.message });
    }
});

// 4. Adult Keyword Generator
router.post('/adult-keyword-generator', async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const prompt = `Generate 10 high-CTR, trending adult ad keywords for the category: ${category}. Return as a comma-separated list.`;
    try {
        const result = await groqTextCompletion(prompt);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI error', details: err.message });
    }
});

// 5. Adult Geo Estimator
router.post('/adult-geo-estimator', async (req, res) => {
    const { volume } = req.body;
    if (!volume) return res.status(400).json({ error: 'Traffic volume is required' });
    const prompt = `You are an ad monetization expert. For adult ad traffic with ${volume} volume, list the best countries (Tier-1, Tier-2, etc.) for high CPM and fill rates. Give a short explanation.`;
    try {
        const result = await groqTextCompletion(prompt);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI error', details: err.message });
    }
});

module.exports = router;