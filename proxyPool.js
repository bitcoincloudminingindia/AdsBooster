require('dotenv').config();

// --- Multi-Account Webshare.io Support ---
const webshareAccounts = [];
for (let i = 1; i <= 6; i++) { // Updated to support 6 accounts
    const username = process.env[`PROXY_USERNAME_${i}`];
    const password = process.env[`PROXY_PASSWORD_${i}`];
    if (username && password) {
        webshareAccounts.push({
            username,
            password,
            proxies: {
                US: (process.env[`PROXY_LIST_US_${i}`] || '').split(',').map(p => p.trim()).filter(Boolean),
                UK: (process.env[`PROXY_LIST_UK_${i}`] || '').split(',').map(p => p.trim()).filter(Boolean),
                FR: (process.env[`PROXY_LIST_FR_${i}`] || '').split(',').map(p => p.trim()).filter(Boolean),
                HR: (process.env[`PROXY_LIST_HR_${i}`] || '').split(',').map(p => p.trim()).filter(Boolean),
            }
        });
    }
}

// Merge all proxies for a country from all accounts
function getAllWebshareProxies(country) {
    const merged = [];
    for (const acc of webshareAccounts) {
        for (const proxy of acc.proxies[country] || []) {
            if (proxy) {
                merged.push({
                    host: proxy.split(':')[0],
                    port: proxy.split(':')[1],
                    username: acc.username,
                    password: acc.password
                });
            }
        }
    }
    return merged;
}

// --- Existing ProxyScrape & ScraperAPI Configs (unchanged) ---
const scraperApiConfig = {
    apiKey: process.env.SCRAPERAPI_KEY || '9b8da492a0cc31782afee7fc755e5ab0',
    baseUrl: 'https://api.scraperapi.com/',
    monthlyLimit: 5000,
    used: 0,
    active: true
};
const proxyScrapeConfig = {
    apiKey: process.env.PROXYSCRAPE_KEY || 'vzv5tsct9066lqkh6qdu',
    baseUrl: 'https://proxyscrape.com/v2/',
    monthlyLimit: 10000,
    used: 0,
    active: true
};

// --- Proxy Rotation State ---
let indices = { US: 0, UK: 0, FR: 0, HR: 0 };
let failedProxies = new Set();

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

// --- Multi-Account Webshare Proxy Selection ---
function getWebshareProxy(country) {
    const allProxies = getAllWebshareProxies(country);
    if (!allProxies.length) return null;
    if (indices[country] === undefined) indices[country] = 0;
    let attempts = 0;
    const maxAttempts = allProxies.length;
    while (attempts < maxAttempts) {
        const proxyObj = allProxies[indices[country]];
        indices[country] = (indices[country] + 1) % allProxies.length;
        const proxyKey = `${proxyObj.username}:${proxyObj.password}@${proxyObj.host}:${proxyObj.port}`;
        if (!failedProxies.has(proxyKey)) {
            return {
                axiosConfig: {
                    host: proxyObj.host,
                    port: parseInt(proxyObj.port),
                    auth: { username: proxyObj.username, password: proxyObj.password },
                    protocol: 'http'
                },
                headers: {
                    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0'
                },
                type: 'residential',
                country: country || 'ANY',
                sessionId: `session_${Date.now()}`,
                provider: 'Webshare.io',
                proxyKey
            };
        }
        attempts++;
    }
    // All proxies failed, reset
    failedProxies.clear();
    indices[country] = 0;
    return null;
}

// --- ProxyScrape & ScraperAPI logic (unchanged) ---
function getProxyScrapeProxy(country) {
    if (!proxyScrapeConfig.active || proxyScrapeConfig.used >= proxyScrapeConfig.monthlyLimit) return null;
    const proxyUrl = `${proxyScrapeConfig.baseUrl}?request=get&apikey=${proxyScrapeConfig.apiKey}&format=json&ssl=yes&anonymity=elite&country=${country || 'all'}`;
    return {
        axiosConfig: null,
        proxyScrapeUrl: proxyUrl,
        headers: {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        },
        type: 'datacenter',
        country: country || 'ANY',
        sessionId: `session_${Date.now()}`,
        provider: 'ProxyScrape'
    };
}
function getScraperApiProxy(country) {
    if (!scraperApiConfig.active || scraperApiConfig.used >= scraperApiConfig.monthlyLimit) return null;
    const scraperUrl = `${scraperApiConfig.baseUrl}?api_key=${scraperApiConfig.apiKey}&url=`;
    return {
        axiosConfig: null,
        scraperApiUrl: scraperUrl,
        headers: {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        },
        type: 'residential',
        country: country || 'ANY',
        sessionId: `session_${Date.now()}`,
        provider: 'ScraperAPI'
    };
}

// --- Last used proxy info ---
let lastUsedProxyInfo = null;

// --- Main getProxy function (triple provider, multi-account) ---
function getProxy({ country, city, session }) {
    // 1. Try Webshare.io (multi-account)
    const webshareProxy = getWebshareProxy(country);
    if (webshareProxy) {
        lastUsedProxyInfo = {
            ip: webshareProxy.axiosConfig?.host,
            port: webshareProxy.axiosConfig?.port,
            provider: webshareProxy.provider,
            country: webshareProxy.country,
            type: webshareProxy.type
        };
        return webshareProxy;
    }
    // 2. Try ProxyScrape
    const proxyScrapeProxy = getProxyScrapeProxy(country);
    if (proxyScrapeProxy) {
        lastUsedProxyInfo = {
            ip: null, // ProxyScrape is a URL, not direct IP
            port: null,
            provider: proxyScrapeProxy.provider,
            country: proxyScrapeProxy.country,
            type: proxyScrapeProxy.type
        };
        return proxyScrapeProxy;
    }
    // 3. Try ScraperAPI
    const scraperProxy = getScraperApiProxy(country);
    if (scraperProxy) {
        lastUsedProxyInfo = {
            ip: null, // ScraperAPI is a URL, not direct IP
            port: null,
            provider: scraperProxy.provider,
            country: scraperProxy.country,
            type: scraperProxy.type
        };
        return scraperProxy;
    }
    // None available
    lastUsedProxyInfo = null;
    return null;
}

// --- Mark failed proxies ---
function markProxyFailed(proxyKey) {
    failedProxies.add(proxyKey);
    console.log(`❌ Marked proxy as failed: ${proxyKey}`);
}
function markScraperApiUsed() {
    scraperApiConfig.used++;
    console.log(`📊 ScraperAPI usage: ${scraperApiConfig.used}/${scraperApiConfig.monthlyLimit}`);
}
function markProxyScrapeUsed() {
    proxyScrapeConfig.used++;
    console.log(`📊 ProxyScrape usage: ${proxyScrapeConfig.used}/${proxyScrapeConfig.monthlyLimit}`);
}

// --- Provider status ---
function getProviderStatus() {
    const status = [];
    // Webshare.io (multi-account)
    for (const country of ['US', 'UK', 'FR', 'HR']) {
        const allProxies = getAllWebshareProxies(country);
        status.push({
            name: `Webshare.io (${country})`,
            type: 'residential',
            provider: 'Webshare.io',
            used: indices[country] || 0,
            limit: allProxies.length,
            active: allProxies.length > 0,
            percentage: allProxies.length ? Math.round(((allProxies.length - Array.from(failedProxies).length) / allProxies.length) * 100) : 0,
            failed: Array.from(failedProxies).length,
            total: allProxies.length
        });
    }
    // ProxyScrape
    status.push({
        name: 'ProxyScrape',
        type: 'datacenter',
        provider: 'ProxyScrape',
        used: proxyScrapeConfig.used,
        limit: proxyScrapeConfig.monthlyLimit,
        active: proxyScrapeConfig.active && proxyScrapeConfig.used < proxyScrapeConfig.monthlyLimit,
        percentage: Math.round((proxyScrapeConfig.used / proxyScrapeConfig.monthlyLimit) * 100),
        failed: 0,
        total: proxyScrapeConfig.monthlyLimit
    });
    // ScraperAPI
    status.push({
        name: 'ScraperAPI',
        type: 'residential',
        provider: 'ScraperAPI',
        used: scraperApiConfig.used,
        limit: scraperApiConfig.monthlyLimit,
        active: scraperApiConfig.active && scraperApiConfig.used < scraperApiConfig.monthlyLimit,
        percentage: Math.round((scraperApiConfig.used / scraperApiConfig.monthlyLimit) * 100),
        failed: 0,
        total: scraperApiConfig.monthlyLimit
    });
    return status;
}

// --- Exported functions ---
module.exports = {
    getProxy,
    getProviderStatus,
    markProxyFailed,
    markScraperApiUsed,
    markProxyScrapeUsed,
    lastUsedProxyInfo
}; 