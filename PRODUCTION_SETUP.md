# 🚀 AdsBooster Production Setup Guide

## 📋 Overview
यह guide आपको AdsBooster को **production-ready Webshare.io proxies** के साथ setup करने में help करेगा।

---

## 🔧 Step 1: Environment Setup

### Create .env file
`AdsBooster` folder में `.env` file बनाएं:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/adsbooster?retryWrites=true&w=majority

# Webshare credentials
PROXY_USERNAME=cpniphqk
PROXY_PASSWORD=6oial84qtxy4

# Proxy groups - country-wise list (comma-separated)
PROXY_LIST_US=38.154.227.167:5868,23.95.150.145:6114,198.23.239.134:6540,216.10.27.159:6837,136.0.207.84:6661,142.147.128.93:6593
PROXY_LIST_UK=45.38.107.97:6014,207.244.217.165:6712
PROXY_LIST_FR=206.41.172.74:6634
PROXY_LIST_HR=107.172.163.27:6543

# Retry attempts for failed proxies
PROXY_RETRY_LIMIT=3

# Request timeout (ms)
REQUEST_TIMEOUT=7000

# Server port
PORT=3001
```

---

## 📦 Step 2: Install Dependencies

```bash
npm install
```

**New Dependencies Added:**
- `https-proxy-agent` - For proxy connections
- All existing dependencies maintained

---

## 🧪 Step 3: Test Proxy System

### Test All Proxies
```bash
npm run test-proxies
```

**Expected Output:**
```
🌐 Testing AdsBooster Proxy System

📋 Environment Check:
✅ PROXY_USERNAME: Set
✅ PROXY_PASSWORD: Set
✅ PROXY_RETRY_LIMIT: 3
✅ REQUEST_TIMEOUT: 7000ms

🌍 Available Countries:
  - US
  - UK
  - FR
  - HR

🔍 Testing US proxies:
  📡 Proxy: 38.154.227.167:5868
  ✅ Success! IP: 38.154.227.167, Country: US

📊 Provider Status:
  🟢 Webshare.io (US): 6/6 active
  🟢 Webshare.io (UK): 2/2 active
  🟢 Webshare.io (FR): 1/1 active
  🟢 Webshare.io (HR): 1/1 active

🎯 Test Complete!
```

---

## 🚀 Step 4: Start Production Server

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
🌐 Production proxy system loaded with Webshare.io
📊 Check /proxy-status endpoint for provider usage
```

---

## 🌐 Step 5: Test Frontend

1. **Open Browser:** `http://localhost:3001`
2. **Add Ad Links:** Single या multiple mode में
3. **Select Country:** US, UK, FR, या HR
4. **Enable IP Rotation:** Toggle switch
5. **Click "🌐 Proxy Status":** Real-time monitoring

---

## 📊 Monitoring & Analytics

### Proxy Status Dashboard
- **URL:** `http://localhost:3001/proxy-status`
- **Features:**
  - Real-time proxy health
  - Failed proxy tracking
  - Country-wise statistics
  - Usage rotation counters

### Frontend Monitoring
- **Button:** "🌐 Proxy Status" in app
- **Features:**
  - Visual status indicators
  - Active/failed proxy counts
  - Geographic distribution

---

## 🔄 Advanced Features

### Automatic Failover
- **Retry Logic:** 3 attempts per request
- **Failed Proxy Detection:** Automatic marking
- **Rotation:** Next available proxy selection
- **Reset:** Failed proxies reset after all attempts

### Session Management
- **Sticky IPs:** 2-minute session duration
- **Country Targeting:** Geographic proxy selection
- **Load Balancing:** Round-robin rotation

### Error Handling
- **Connection Errors:** ECONNREFUSED, ETIMEDOUT, ENOTFOUND
- **Proxy Marking:** Failed proxies automatically marked
- **Fallback:** US proxies as default

---

## 🛠️ Troubleshooting

### Common Issues

**1. "No proxy available for country"**
```bash
# Check .env file
cat .env | grep PROXY_LIST

# Verify proxy lists are set
echo $PROXY_LIST_US
```

**2. "All proxy attempts failed"**
```bash
# Test individual proxies
npm run test-proxies

# Check proxy credentials
echo $PROXY_USERNAME
echo $PROXY_PASSWORD
```

**3. "MongoDB connection failed"**
```bash
# Update MONGO_URI in .env
# Use your actual MongoDB Atlas connection string
```

### Debug Commands

**Test Specific Proxy:**
```bash
curl -x http://cpniphqk:6oial84qtxy4@38.154.227.167:5868 http://ipinfo.io/json
```

**Check Server Logs:**
```bash
npm run dev
# Watch console for proxy rotation logs
```

**Monitor Proxy Status:**
```bash
curl http://localhost:3001/proxy-status
```

---

## 📈 Performance Optimization

### Recommended Settings
```env
# Optimal timeout for ad networks
REQUEST_TIMEOUT=7000

# Balanced retry attempts
PROXY_RETRY_LIMIT=3

# Geographic distribution
PROXY_LIST_US=6_proxies
PROXY_LIST_UK=2_proxies
PROXY_LIST_FR=1_proxy
PROXY_LIST_HR=1_proxy
```

### Best Practices
1. **Geographic Distribution:** Use multiple countries
2. **Load Balancing:** Distribute requests across proxies
3. **Monitoring:** Regular status checks
4. **Error Handling:** Automatic failover
5. **Session Management:** Sticky IPs for consistency

---

## 🔒 Security & Compliance

### Proxy Security
- ✅ **Residential IPs:** Genuine user traffic
- ✅ **Geographic Targeting:** Country-specific proxies
- ✅ **Session Isolation:** User session management
- ✅ **Error Handling:** Safe failover mechanisms

### Ad Network Compliance
- ✅ **No Auto-clicking:** Manual refresh only
- ✅ **Genuine Traffic:** Residential proxy usage
- ✅ **Geographic Accuracy:** Country-specific targeting
- ✅ **Session Consistency:** Sticky IP management

---

## 🎯 Production Checklist

- [ ] `.env` file created with all credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Proxy system tested (`npm run test-proxies`)
- [ ] MongoDB connection verified
- [ ] Frontend accessible at `http://localhost:3001`
- [ ] Proxy status dashboard working
- [ ] Country selection functional
- [ ] IP rotation working
- [ ] Error handling tested
- [ ] Monitoring setup complete

---

## 📞 Support

अगर कोई issue है:
1. **Check logs:** `npm run dev`
2. **Test proxies:** `npm run test-proxies`
3. **Verify .env:** All variables set correctly
4. **Check MongoDB:** Connection string valid

**Happy Ad Boosting! 🚀** 