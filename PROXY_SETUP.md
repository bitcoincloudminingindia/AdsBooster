# 🌐 AdsBooster Proxy Setup Guide

## 📋 Overview
AdsBooster में 10 free proxy providers integrated हैं जो automatic failover के साथ काम करते हैं। जब एक provider का monthly limit खत्म हो जाता है, तो system automatically अगले provider पर switch कर देता है।

## 🚀 Quick Setup

### Step 1: Proxy Credentials डालना
`proxyPool.js` file में अपने proxy credentials डालें:

```javascript
// Webshare.io
auth: { username: 'YOUR_WEBSHARE_USER', password: 'YOUR_WEBSHARE_PASS' }

// GeoNode  
auth: { username: 'YOUR_GEONODE_USER', password: 'YOUR_GEONODE_PASS' }

// और बाकी providers...
```

### Step 2: Backend Restart
```bash
npm run dev
```

### Step 3: Proxy Status Check
Browser में `http://localhost:3001/proxy-status` visit करें या app में "🌐 Proxy Status" button click करें।

---

## 📊 Supported Providers

### 1. **Webshare.io** 
- **Type:** Residential
- **Limit:** 1GB/month, 10 proxies
- **Features:** Country selection, sticky sessions
- **Setup:** Free signup → Dashboard → API credentials copy

### 2. **ProxyScrape**
- **Type:** Datacenter  
- **Limit:** Limited monthly bandwidth
- **Features:** Rotating proxies, location filters
- **Setup:** No auth required (free tier)

### 3. **GeoNode**
- **Type:** Residential + Datacenter
- **Limit:** 1GB free monthly
- **Features:** Geo-targeting, session management
- **Setup:** Free signup → API key generate

### 4. **ScraperAPI**
- **Type:** Residential
- **Limit:** 5,000 requests/month free
- **Features:** Auto IP rotation, geo-targeting
- **Setup:** Free signup → API key copy

### 5. **Froxy.io**
- **Type:** Residential
- **Limit:** 1GB monthly bandwidth free
- **Features:** 200+ locations
- **Setup:** Free signup → Dashboard credentials

### 6. **IPRoyal Free Tier**
- **Type:** Residential
- **Limit:** 1GB monthly
- **Features:** Location targeting
- **Setup:** Free signup → API credentials

### 7. **Storm Proxies Trial**
- **Type:** Residential
- **Limit:** Recurring monthly test credits
- **Features:** Auto-rotation
- **Setup:** Trial signup → Dashboard access

### 8. **Spys.one API**
- **Type:** Public rotating proxies
- **Limit:** Free monthly usage limit
- **Features:** No auth required
- **Setup:** Direct usage (no signup needed)

### 9. **KProxy Premium Free Plan**
- **Type:** Residential
- **Limit:** 300MB/day (~9GB/month)
- **Features:** Multiple locations
- **Setup:** Free signup → Premium plan activate

### 10. **FreeProxyWorld API**
- **Type:** Datacenter
- **Limit:** 1GB/month API usage
- **Features:** IP rotation, region filter
- **Setup:** Free signup → API key generate

---

## 🔧 Advanced Configuration

### Location Targeting
```javascript
// Country-specific proxy
const proxy = getProxy({ country: 'US', city: 'New York' });

// City-level targeting (supported providers only)
const proxy = getProxy({ country: 'IN', city: 'Mumbai' });
```

### Session Management
```javascript
// Sticky IP for 2 minutes
const proxy = getProxy({ 
    country: 'US', 
    session: 'user_session_123' 
});
```

### Failover Mechanism
- System automatically switches providers when limits exceeded
- Real-time monitoring via `/proxy-status` endpoint
- Usage tracking per provider

---

## 📈 Monitoring & Analytics

### Proxy Status Dashboard
- Real-time provider usage
- Active/inactive status
- Monthly limit tracking
- Failover notifications

### Usage Analytics
- Total requests per provider
- Geographic distribution
- Success/failure rates
- Cost optimization insights

---

## ⚠️ Important Notes

### Compliance
- ✅ Residential proxies for genuine traffic
- ✅ No auto-clicking or invalid traffic
- ✅ Ad network policy compliant
- ✅ Safe browsing practices

### Performance
- Sticky sessions: 2 minutes per IP
- Automatic failover on errors
- Load balancing across providers
- Real-time health monitoring

### Security
- Credentials stored in environment variables
- No hardcoded passwords
- Encrypted proxy connections
- Session isolation

---

## 🛠️ Troubleshooting

### Common Issues

**1. "All providers exhausted"**
- Solution: Wait for monthly reset or add paid providers
- Check `/proxy-status` for current usage

**2. "Proxy connection failed"**
- Solution: Check credentials and network connectivity
- Verify provider is active and has bandwidth

**3. "Location not supported"**
- Solution: Use supported countries or remove location filter
- Check provider documentation for supported regions

### Debug Commands
```bash
# Check proxy status
curl http://localhost:3001/proxy-status

# Test specific provider
curl -x http://username:password@proxy.host:port http://httpbin.org/ip

# Monitor logs
npm run dev
```

---

## 🎯 Best Practices

1. **Start with Free Providers:** Test with free tiers before upgrading
2. **Monitor Usage:** Regular check of `/proxy-status` endpoint  
3. **Geographic Distribution:** Use multiple countries for better results
4. **Session Management:** Use sticky sessions for consistent experience
5. **Error Handling:** Implement retry logic for failed requests
6. **Cost Optimization:** Track usage and optimize provider selection

---

## 📞 Support

अगर कोई issue है या setup में help चाहिए:
- Check `/proxy-status` endpoint
- Review server logs
- Verify credentials format
- Test individual providers

**Happy Ad Boosting! 🚀** 