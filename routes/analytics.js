const express = require('express');
const router = express.Router();
const { db } = require('../server');

// Persist tool usage in MongoDB
router.post('/track', async (req, res) => {
    const { tool } = req.body;
    if (!tool) return res.status(400).json({ error: 'Tool name required' });
    await db.collection('toolUsage').updateOne(
        { tool },
        { $inc: { count: 1 } },
        { upsert: true }
    );
    const usage = await db.collection('toolUsage').findOne({ tool });
    res.json({ usage: usage.count });
});

router.get('/stats', async (req, res) => {
    const stats = await db.collection('toolUsage').find().toArray();
    res.json(stats.reduce((acc, cur) => { acc[cur.tool] = cur.count; return acc; }, {}));
});

module.exports = router; 