const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { getProxy, getProviderStatus, markProxyFailed, markProxyScrapeUsed, lastUsedProxyInfo } = require('./proxyPool');
const { MongoClient } = require('mongodb');
require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI);
const path = require('path');

const app = express();
app.use(express.static(__dirname));
const PORT = process.env.PORT || 3001;

app.use(cors());

// MongoDB connection test on server start
(async () => {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        await client.db('adsbooster').command({ ping: 1 });
        console.log('MongoDB connection: SUCCESS');
        await client.close();
    } catch (err) {
        console.error('MongoDB connection: FAILED', err.message);
    }
})();

// --- User Data Structure (In-memory) ---
const users = {};
const REWARD_PER_ACTIVITY = 10; // हर valid activity पर मिलने वाले points
const MIN_REFRESH_INTERVAL = 10 * 1000; // 10 seconds (ms)

// --- /ad-activity Endpoint ---
// Example: /ad-activity?userId=xyz&type=view
app.get('/ad-activity', (req, res) => {
    const userId = req.query.userId;
    const activityType = req.query.type; // 'view' या 'click'
    const now = Date.now();

    if (!userId || !activityType) {
        return res.status(400).json({ success: false, message: 'Missing userId or activity type' });
    }

    // User init
    if (!users[userId]) {
        users[userId] = {
            reward: 0,
            lastActivity: 0,
            suspicious: false,
            activityLog: []
        };
    }

    const user = users[userId];

    // Fraud Detection: Minimum refresh interval
    if (now - user.lastActivity < MIN_REFRESH_INTERVAL) {
        user.suspicious = true;
        user.activityLog.push({ time: now, type: activityType, status: 'suspicious' });
        return res.status(429).json({ success: false, message: 'Too many requests. Suspicious activity detected.' });
    }

    // Activity Log
    user.lastActivity = now;
    user.activityLog.push({ time: now, type: activityType, status: 'valid' });

    // Reward Assignment (अगर suspicious नहीं है)
    if (!user.suspicious) {
        user.reward += REWARD_PER_ACTIVITY;
    }

    return res.json({
        success: true,
        reward: user.reward,
        suspicious: user.suspicious
    });
});

// --- User Reward Balance Endpoint ---
// Example: /user-reward?userId=xyz
app.get('/user-reward', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
    }
    const user = users[userId];
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
        success: true,
        reward: user.reward,
        suspicious: user.suspicious
    });
});

// /fetch?url=...&country=...&rotate=1
app.get('/fetch', async (req, res) => {
    const { url, country, rotate } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url param' });

    let attempts = 0;
    const maxAttempts = parseInt(process.env.PROXY_RETRY_LIMIT || '3', 10);
    const timeout = parseInt(process.env.REQUEST_TIMEOUT || '7000', 10);

    while (attempts < maxAttempts) {
        try {
            // Get proxy with session management
            const sessionId = req.query.session || `session_${Date.now()}`;
            const proxy = getProxy({
                country,
                city: req.query.city,
                session: rotate === '1' ? sessionId : null
            });

            if (!proxy) {
                throw new Error(`No proxy available for country: ${country}`);
            }

            const axiosConfig = {
                proxy: proxy.axiosConfig,
                headers: proxy.headers,
                timeout: timeout,
                responseType: 'arraybuffer', // For binary (images, etc.)
                validateStatus: () => true,
            };

            // Handle different proxy types
            let response;
            if (proxy.provider === 'ScraperAPI') {
                // Use ScraperAPI direct call
                const scraperUrl = `${proxy.scraperApiUrl}${encodeURIComponent(url)}`;
                response = await axios.get(scraperUrl, {
                    headers: proxy.headers,
                    timeout: timeout,
                    responseType: 'arraybuffer',
                    validateStatus: () => true,
                });

                // Update ScraperAPI usage
                markScraperApiUsed();

                console.log(`✅ Success via ScraperAPI (attempt ${attempts + 1})`);
            } else if (proxy.provider === 'ProxyScrape') {
                // Use ProxyScrape API
                const proxyScrapeUrl = `${proxy.proxyScrapeUrl}&url=${encodeURIComponent(url)}`;
                response = await axios.get(proxyScrapeUrl, {
                    headers: proxy.headers,
                    timeout: timeout,
                    responseType: 'arraybuffer',
                    validateStatus: () => true,
                });

                // Update ProxyScrape usage
                markProxyScrapeUsed();

                console.log(`✅ Success via ProxyScrape (attempt ${attempts + 1})`);
            } else {
                // Use traditional proxy (Webshare.io)
                response = await axios.get(url, axiosConfig);
                console.log(`✅ Success via ${proxy.proxyUrl} (attempt ${attempts + 1})`);
            }

            // Forward status, headers, and body
            res.status(response.status);
            Object.entries(response.headers).forEach(([k, v]) => res.setHeader(k, v));
            res.send(response.data);
            return;

        } catch (err) {
            attempts++;
            console.log(`❌ Failed via proxy (attempt ${attempts}/${maxAttempts}): ${err.message}`);

            // Mark proxy as failed if it's a connection error
            if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
                const proxy = getProxy({ country, session: req.query.session });
                if (proxy) {
                    markProxyFailed(proxy.proxyUrl);
                }
            }

            if (attempts >= maxAttempts) {
                res.status(502).json({
                    error: 'All proxy attempts failed',
                    details: err.message,
                    attempts: attempts,
                    country: country
                });
                return;
            }
        }
    }
});

// /test-link?url=...&country=...
app.get('/test-link', async (req, res) => {
    const { url, country } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url param' });
    try {
        const proxyObj = getProxy({ country });
        if (!proxyObj) return res.status(502).json({ error: 'No proxy available for country: ' + country });
        const axiosConfig = {
            proxy: proxyObj.axiosConfig,
            headers: proxyObj.headers,
            timeout: 7000,
            validateStatus: () => true,
        };
        const response = await require('axios').get(url, axiosConfig);
        if (response.status === 200) {
            if (!country || country === '') {
                console.log(`[Proxy] 'Any' selected, using country: ${proxyObj.selectedCountry}, IP: ${proxyObj.axiosConfig?.host}`);
            }
            res.json({ success: true, status: response.status, actualCountry: proxyObj.selectedCountry });
        } else {
            res.status(400).json({ success: false, status: response.status, error: 'Non-200 status', actualCountry: proxyObj.selectedCountry });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get proxy provider status
app.get('/proxy-status', (req, res) => {
    try {
        const status = getProviderStatus();
        res.json({
            providers: status,
            totalProviders: status.length,
            activeProviders: status.filter(p => p.active).length,
            lastUsedProxy: lastUsedProxyInfo,
            actualCountry: lastUsedProxyInfo ? lastUsedProxyInfo.country : null
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get proxy status', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`AdsBooster backend running on port ${PORT}`);
    console.log('🌐 Triple proxy system loaded: Webshare.io + ProxyScrape + ScraperAPI');
    console.log('📊 Check /proxy-status endpoint for provider usage');
}); 