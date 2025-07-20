# 🌐 AdsBooster Dual Proxy Setup Guide

## 📋 Overview
AdsBooster में अब **dual proxy system** है - **Webshare.io (Primary)** + **ScraperAPI (Fallback)**। यह system maximum reliability और redundancy provide करता है।

---

## 🔧 Step 1: Environment Setup

### Create .env file
`AdsBooster` folder में `.env` file बनाएं:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/adsbooster?retryWrites=true&w=majority

# Webshare.io credentials (Primary Provider)
PROXY_USERNAME=cpniphqk
PROXY_PASSWORD=6oial84qtxy4

# Webshare.io proxy groups - country-wise list (comma-separated)
PROXY_LIST_US=38.154.227.167:5868,23.95.150.145:6114,198.23.239.134:6540,216.10.27.159:6837,136.0.207.84:6661,142.147.128.93:6593
PROXY_LIST_UK=45.38.107.97:6014,207.244.217.165:6712
PROXY_LIST_FR=206.41.172.74:6634
PROXY_LIST_HR=107.172.163.27:6543

# ScraperAPI credentials (Fallback Provider)
SCRAPERAPI_KEY=9b8da492a0cc31782afee7fc755e5ab0

# Retry attempts for failed proxies
PROXY_RETRY_LIMIT=3

# Request timeout (ms)
REQUEST_TIMEOUT=7000

# Server port
PORT=3001
```

---

## 📊 Dual Provider System

### **Primary Provider: Webshare.io**
- ✅ **10 Dedicated Proxies** across 4 countries
- ✅ **No Monthly Limits** - Unlimited usage
- ✅ **High Performance** - Dedicated residential IPs
- ✅ **Geographic Targeting** - Country-specific proxies
- ✅ **Automatic Failover** - Failed proxy detection

### **Fallback Provider: ScraperAPI**
- ✅ **5,000 API Credits** per month (free trial)
- ✅ **Residential IPs** - Genuine user traffic
- ✅ **Global Coverage** - Worldwide locations
- ✅ **API-based** - Direct HTTP requests
- ✅ **Automatic Activation** - When Webshare fails

---

## 🔄 Failover Logic

### **Step-by-Step Process:**
1. **Request comes** for specific country
2. **Try Webshare.io first** (Primary provider)
3. **If Webshare fails** → Mark proxy as failed
4. **Try next Webshare proxy** (Round-robin)
5. **If all Webshare fail** → Switch to ScraperAPI
6. **ScraperAPI handles** → Direct API call
7. **Track usage** → Monitor both providers

### **Example Flow:**
```
Request for US:
1. Try: Webshare.io (38.154.227.167:5868) ✅ Success
2. Next request: Webshare.io (23.95.150.145:6114) ❌ Failed
3. Try: Webshare.io (198.23.239.134:6540) ✅ Success
4. If all Webshare fail: ScraperAPI ✅ Fallback
```

---

## 🧪 Step 2: Test Dual Proxy System

### Test All Providers
```bash
npm run test-proxies
```

**Expected Output:**
```
🌐 Testing AdsBooster Proxy System

📋 Environment Check:
✅ PROXY_USERNAME: Set
✅ PROXY_PASSWORD: Set
✅ SCRAPERAPI_KEY: Set
✅ PROXY_RETRY_LIMIT: 3
✅ REQUEST_TIMEOUT: 7000ms

🌍 Available Countries:
  - US
  - UK
  - FR
  - HR

🔍 Testing US proxies:
  📡 Webshare.io Proxy: 38.154.227.167:5868
  ✅ Webshare.io Success! IP: 38.154.227.167, Country: US
  📡 ScraperAPI Proxy: Available (API-based)
  ✅ ScraperAPI Ready! Credits: 0/5000

📊 Provider Status:
  🟢 Webshare.io (US): 6/6 active
  🟢 Webshare.io (UK): 2/2 active
  🟢 Webshare.io (FR): 1/1 active
  🟢 Webshare.io (HR): 1/1 active
  🟢 ScraperAPI: 0/5000 credits used

🎯 Test Complete!
```

---

## 🚀 Step 3: Start Production Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

**Server Output:**
```
AdsBooster backend running on port 3001
MongoDB connection: SUCCESS
🌐 Dual proxy system loaded: Webshare.io + ScraperAPI
📊 Check /proxy-status endpoint for provider usage
```

---

## 📊 Monitoring & Analytics

### Proxy Status Dashboard
- **URL:** `http://localhost:3001/proxy-status`
- **Features:**
  - Real-time provider health
  - Webshare.io proxy status
  - ScraperAPI credit usage
  - Failover statistics
  - Geographic distribution

### Frontend Monitoring
- **Button:** "🌐 Proxy Status" in app
- **Features:**
  - Dual provider status
  - Usage tracking
  - Failover indicators

---

## 🔄 Advanced Features

### **Automatic Failover**
- **Primary:** Webshare.io (10 proxies)
- **Fallback:** ScraperAPI (5000 credits)
- **Smart Selection:** Best available provider
- **Usage Tracking:** Monitor both providers

### **Geographic Targeting**
- **Webshare.io:** Country-specific proxies
- **ScraperAPI:** Global coverage
- **Fallback Logic:** Geographic preference

### **Performance Optimization**
- **Webshare.io:** Fast dedicated proxies
- **ScraperAPI:** Reliable API calls
- **Load Balancing:** Optimal provider selection

---

## 📈 Provider Comparison

| Feature | Webshare.io | ScraperAPI |
|---------|-------------|------------|
| **Type** | Dedicated Proxies | API Service |
| **Limit** | Unlimited | 5000 credits/month |
| **Performance** | High | Medium |
| **Reliability** | High | High |
| **Cost** | Paid | Free Trial |
| **Geographic** | 4 Countries | Global |
| **Failover** | Primary | Secondary |

---

## 🛠️ Troubleshooting

### Common Issues

**1. "No proxy available for country"**
```bash
# Check both providers
npm run test-proxies

# Verify .env variables
echo $PROXY_USERNAME
echo $SCRAPERAPI_KEY
```

**2. "All proxy attempts failed"**
```bash
# Check provider status
curl http://localhost:3001/proxy-status

# Test individual providers
npm run test-proxies
```

**3. "ScraperAPI limit reached"**
```bash
# Check credit usage
curl http://localhost:3001/proxy-status | grep ScraperAPI

# Wait for monthly reset or upgrade plan
```

### Debug Commands

**Test Webshare.io:**
```bash
curl -x http://cpniphqk:6oial84qtxy4@38.154.227.167:5868 http://ipinfo.io/json
```

**Test ScraperAPI:**
```bash
curl "https://api.scraperapi.com/?api_key=9b8da492a0cc31782afee7fc755e5ab0&url=http://ipinfo.io/json"
```

**Monitor Both Providers:**
```bash
npm run dev
# Watch console for provider selection logs
```

---

## 🎯 Best Practices

### **Provider Selection**
1. **Use Webshare.io first** - Better performance
2. **Fallback to ScraperAPI** - When needed
3. **Monitor usage** - Track both providers
4. **Geographic distribution** - Multiple countries

### **Performance Optimization**
1. **Load balancing** - Distribute across providers
2. **Error handling** - Automatic failover
3. **Usage tracking** - Monitor limits
4. **Geographic targeting** - Country-specific

### **Cost Management**
1. **Primary:** Webshare.io (unlimited)
2. **Fallback:** ScraperAPI (5000 credits)
3. **Monitoring:** Track usage patterns
4. **Optimization:** Minimize fallback usage

---

## 🔒 Security & Compliance

### **Dual Provider Security**
- ✅ **Residential IPs:** Both providers
- ✅ **Geographic Accuracy:** Country targeting
- ✅ **Session Management:** Sticky IPs
- ✅ **Error Handling:** Safe failover

### **Ad Network Compliance**
- ✅ **Genuine Traffic:** Residential proxies
- ✅ **No Auto-clicking:** Manual refresh
- ✅ **Geographic Targeting:** Country-specific
- ✅ **Session Consistency:** Sticky IPs

---

## 🎯 Production Checklist

- [ ] `.env` file created with dual provider credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Dual proxy system tested (`npm run test-proxies`)
- [ ] MongoDB connection verified
- [ ] Frontend accessible at `http://localhost:3001`
- [ ] Dual provider status dashboard working
- [ ] Country selection functional
- [ ] IP rotation working
- [ ] Failover mechanism tested
- [ ] Monitoring setup complete

---

## 📞 Support

अगर कोई issue है:
1. **Check logs:** `npm run dev`
2. **Test both providers:** `npm run test-proxies`
3. **Verify .env:** All variables set correctly
4. **Check provider status:** `/proxy-status` endpoint

**Happy Ad Boosting with Dual Proxy System! 🚀** 