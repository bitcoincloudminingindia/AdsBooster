require('dotenv').config();
// MongoDB connection and analytics functions
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'adsbooster';

async function saveAnalytics(session, url, ip) {
    await client.connect();
    console.log('MongoDB connected!');
    const db = client.db(dbName);
    const col = db.collection('analytics');
    await col.updateOne(
        { session },
        { $inc: { views: 1 }, $set: { lastUrl: url, lastIp: ip, lastViewed: new Date() } },
        { upsert: true }
    );
}

async function getAnalytics(session) {
    await client.connect();
    console.log('MongoDB connected!');
    const db = client.db(dbName);
    const col = db.collection('analytics');
    const doc = await col.findOne({ session });
    return doc || { session, views: 0 };
}

async function getIpInfo(session) {
    await client.connect();
    console.log('MongoDB connected!');
    const db = client.db(dbName);
    const col = db.collection('analytics');
    const doc = await col.findOne({ session });
    return doc ? { ip: doc.lastIp, lastViewed: doc.lastViewed } : { ip: null };
}

module.exports = { saveAnalytics, getAnalytics, getIpInfo }; 