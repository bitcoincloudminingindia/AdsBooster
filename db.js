const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

let dbInstance;

async function connectDB() {
  if (!dbInstance) {
    await client.connect();
    dbInstance = client.db('adsbooster');
    console.log('MongoDB connected!');
  }
  return dbInstance;
}

module.exports = { connectDB }; 