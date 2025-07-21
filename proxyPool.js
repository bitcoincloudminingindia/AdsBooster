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

// Normalize country code for proxy selection
function normalizeCountryCode(country) {
    if (!country) return 'US';
    if (country.toUpperCase() === 'GB') return 'UK';
    if (country.toUpperCase() === 'UK') return 'UK';
    if (country.toUpperCase() === 'US') return 'US';
    if (country.toUpperCase() === 'FR') return 'FR';
    if (country.toUpperCase() === 'HR') return 'HR';
    return 'US'; // fallback
}

// Merge all proxies for a country from all accounts
function getAllWebshareProxies(country) {
    const merged = [];
    const normCountry = normalizeCountryCode(country);
    for (const acc of webshareAccounts) {
        for (const proxy of acc.proxies[normCountry] || []) {
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
    apiKey: process.env.SCRAPERAPI_KEY,
    baseUrl: 'https://api.scraperapi.com/',
    monthlyLimit: 5000,
    used: 0,
    active: true
};
const proxyScrapeConfig = {
    apiKey: process.env.PROXYSCRAPE_KEY,
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
    const normCountry = normalizeCountryCode(country);
    const allProxies = getAllWebshareProxies(normCountry);
    if (!allProxies.length) return null;
    if (indices[normCountry] === undefined) indices[normCountry] = 0;
    let attempts = 0;
    const maxAttempts = allProxies.length;
    while (attempts < maxAttempts) {
        const proxyObj = allProxies[indices[normCountry]];
        indices[normCountry] = (indices[normCountry] + 1) % allProxies.length;
        const proxyKey = `${proxyObj.username}:${proxyObj.password}@${proxyObj.host}:${proxyObj.port}`;
        if (!failedProxies.has(proxyKey)) {
            console.log(`[ProxyPool] Selected proxy for ${normCountry}: ${proxyKey}`);
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
                country: normCountry || 'ANY',
                sessionId: `session_${Date.now()}`,
                provider: 'Webshare.io',
                proxyKey
            };
        }
        attempts++;
    }
    // All proxies failed, reset
    failedProxies.clear();
    indices[normCountry] = 0;
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
    const normCountry = normalizeCountryCode(country);
    // 1. Try Webshare.io (multi-account)
    const webshareProxy = getWebshareProxy(normCountry);
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

// Add function to get available countries with at least one proxy
function getAvailableCountries() {
    const countries = [];
    for (const country of ['US', 'UK', 'FR', 'HR']) {
        if (getAllWebshareProxies(country).length > 0) {
            countries.push(country);
        }
    }
    return countries;
}

// --- Exported functions ---
module.exports = {
    getProxy,
    getProviderStatus,
    markProxyFailed,
    markScraperApiUsed,
    markProxyScrapeUsed,
    lastUsedProxyInfo,
    getAvailableCountries // export new function
}; 