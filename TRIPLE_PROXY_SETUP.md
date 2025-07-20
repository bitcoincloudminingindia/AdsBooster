# 🌐 AdsBooster Triple Proxy Setup Guide

## 📋 Overview
AdsBooster में अब **triple proxy system** है - **Webshare.io (Primary)** + **ProxyScrape (Secondary)** + **ScraperAPI (Tertiary)**। यह system maximum reliability और redundancy provide करता है।

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

# ProxyScrape credentials (Secondary Provider)
PROXYSCRAPE_KEY=vzv5tsct9066lqkh6qdu

# ScraperAPI credentials (Tertiary Provider)
SCRAPERAPI_KEY=9b8da492a0cc31782afee7fc755e5ab0

# Retry attempts for failed proxies
PROXY_RETRY_LIMIT=3

# Request timeout (ms)
REQUEST_TIMEOUT=7000

# Server port
PORT=3001
```

---

## 📊 Triple Provider System

### **Primary Provider: Webshare.io**
- ✅ **10 Dedicated Proxies** across 4 countries
- ✅ **No Monthly Limits** - Unlimited usage
- ✅ **High Performance** - Dedicated residential IPs
- ✅ **Geographic Targeting** - Country-specific proxies
- ✅ **Automatic Failover** - Failed proxy detection

### **Secondary Provider: ProxyScrape**
- ✅ **Premium API Access** - High-quality datacenter proxies
- ✅ **10,000 Monthly Requests** - Premium limit
- ✅ **Global Coverage** - Worldwide locations
- ✅ **API-based** - Direct HTTP requests
- ✅ **Elite Anonymity** - High security level

### **Tertiary Provider: ScraperAPI**
- ✅ **5,000 API Credits** per month (free trial)
- ✅ **Residential IPs** - Genuine user traffic
- ✅ **Global Coverage** - Worldwide locations
- ✅ **API-based** - Direct HTTP requests
- ✅ **Automatic Activation** - When others fail

---

## 🔄 Triple Failover Logic

### **Step-by-Step Process:**
1. **Request comes** for specific country
2. **Try Webshare.io first** (Primary provider)
3. **If Webshare fails** → Mark proxy as failed
4. **Try next Webshare proxy** (Round-robin)
5. **If all Webshare fail** → Switch to ProxyScrape
6. **If ProxyScrape fails** → Switch to ScraperAPI
7. **Track usage** → Monitor all three providers

### **Example Flow:**
```
Request for US:
1. Try: Webshare.io (38.154.227.167:5868) ✅ Success
2. Next request: Webshare.io (23.95.150.145:6114) ❌ Failed
3. Try: Webshare.io (198.23.239.134:6540) ✅ Success
4. If all Webshare fail: ProxyScrape ✅ Secondary
5. If ProxyScrape fails: ScraperAPI ✅ Tertiary
```

---

## 🚀 Step 2: Start Production Server

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
🌐 Triple proxy system loaded: Webshare.io + ProxyScrape + ScraperAPI
📊 Check /proxy-status endpoint for provider usage
```

---

## 📊 Monitoring & Analytics

### Proxy Status Dashboard
- **URL:** `http://localhost:3001/proxy-status`
- **Features:**
  - Real-time provider health
  - Webshare.io proxy status
  - ProxyScrape usage tracking
  - ScraperAPI credit usage
  - Triple failover statistics
  - Geographic distribution

### Frontend Monitoring
- **Button:** "🌐 Proxy Status" in app
- **Features:**
  - Triple provider status
  - Usage tracking
  - Failover indicators

---

## 🔄 Advanced Features

### **Triple Automatic Failover**
- **Primary:** Webshare.io (10 proxies)
- **Secondary:** ProxyScrape (10,000 requests)
- **Tertiary:** ScraperAPI (5000 credits)
- **Smart Selection:** Best available provider
- **Usage Tracking:** Monitor all providers

### **Geographic Targeting**
- **Webshare.io:** Country-specific proxies
- **ProxyScrape:** Global coverage
- **ScraperAPI:** Global coverage
- **Fallback Logic:** Geographic preference

### **Performance Optimization**
- **Webshare.io:** Fast dedicated proxies
- **ProxyScrape:** High-quality datacenter
- **ScraperAPI:** Reliable API calls
- **Load Balancing:** Optimal provider selection

---

## 📈 Provider Comparison

| Feature | Webshare.io | ProxyScrape | ScraperAPI |
|---------|-------------|-------------|------------|
| **Type** | Dedicated Proxies | API Service | API Service |
| **Limit** | Unlimited | 10,000 requests | 5000 credits |
| **Performance** | High | High | Medium |
| **Reliability** | High | High | High |
| **Cost** | Paid | Premium | Free Trial |
| **Geographic** | 4 Countries | Global | Global |
| **Failover** | Primary | Secondary | Tertiary |

---

## 🛠️ Troubleshooting

### Common Issues

**1. "No proxy available for country"**
```bash
# Check all three providers
curl http://localhost:3001/proxy-status

# Verify .env variables
echo $PROXY_USERNAME
echo $PROXYSCRAPE_KEY
echo $SCRAPERAPI_KEY
```

**2. "All proxy attempts failed"**
```bash
# Check provider status
curl http://localhost:3001/proxy-status

# Test individual providers
npm run dev
```

**3. "ProxyScrape limit reached"**
```bash
# Check usage
curl http://localhost:3001/proxy-status | grep ProxyScrape

# Wait for monthly reset or upgrade plan
```

### Debug Commands

**Test Webshare.io:**
```bash
curl -x http://cpniphqk:6oial84qtxy4@38.154.227.167:5868 http://ipinfo.io/json
```

**Test ProxyScrape:**
```bash
curl "https://proxyscrape.com/v2/?request=get&apikey=vzv5tsct9066lqkh6qdu&format=json&ssl=yes&anonymity=elite&country=us"
```

**Test ScraperAPI:**
```bash
curl "https://api.scraperapi.com/?api_key=9b8da492a0cc31782afee7fc755e5ab0&url=http://ipinfo.io/json"
```

**Monitor All Providers:**
```bash
npm run dev
# Watch console for provider selection logs
```

---

## 🎯 Best Practices

### **Provider Selection**
1. **Use Webshare.io first** - Best performance
2. **Fallback to ProxyScrape** - High quality
3. **Use ScraperAPI last** - Reliable backup
4. **Monitor usage** - Track all providers

### **Performance Optimization**
1. **Load balancing** - Distribute across providers
2. **Error handling** - Automatic failover
3. **Usage tracking** - Monitor limits
4. **Geographic targeting** - Country-specific

### **Cost Management**
1. **Primary:** Webshare.io (unlimited)
2. **Secondary:** ProxyScrape (10,000 requests)
3. **Tertiary:** ScraperAPI (5000 credits)
4. **Monitoring:** Track usage patterns

---

## 🔒 Security & Compliance

### **Triple Provider Security**
- ✅ **Residential IPs:** Webshare.io + ScraperAPI
- ✅ **Datacenter IPs:** ProxyScrape (elite)
- ✅ **Geographic Accuracy:** Country targeting
- ✅ **Session Management:** Sticky IPs
- ✅ **Error Handling:** Safe failover

### **Ad Network Compliance**
- ✅ **Genuine Traffic:** Multiple residential providers
- ✅ **No Auto-clicking:** Manual refresh
- ✅ **Geographic Targeting:** Country-specific
- ✅ **Session Consistency:** Sticky IPs

---

## 🎯 Production Checklist

- [ ] `.env` file created with triple provider credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Triple proxy system tested
- [ ] MongoDB connection verified
- [ ] Frontend accessible at `http://localhost:3001`
- [ ] Triple provider status dashboard working
- [ ] Country selection functional
- [ ] IP rotation working
- [ ] Triple failover mechanism tested
- [ ] Monitoring setup complete

---

## 📞 Support

अगर कोई issue है:
1. **Check logs:** `npm run dev`
2. **Test all providers:** Check `/proxy-status`
3. **Verify .env:** All variables set correctly
- [ ] **Check provider status:** `/proxy-status` endpoint

**Happy Ad Boosting with Triple Proxy System! 🚀** 