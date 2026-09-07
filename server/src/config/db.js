const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongod = null;
const activeUriFile = path.resolve(__dirname, '../../.mongo_uri_active');

const connectDB = async () => {
  const defaultUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cosathi';

  // 1. If an external Atlas cluster URI is provided, use it
  if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1')) {
    try {
      console.log(`[Database] Connecting to MongoDB Atlas: ${defaultUri.replace(/\/\/.*@/, '//<credentials>@')}`);
      await mongoose.connect(defaultUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[Database] Connected to MongoDB Atlas: ${mongoose.connection.host}`);
      return;
    } catch (atlasErr) {
      console.warn(`[Database] MongoDB Atlas connection failed: ${atlasErr.message}. Falling back...`);
    }
  }

  // 2. Check if an active local embedded URI is saved and reachable
  if (fs.existsSync(activeUriFile)) {
    try {
      const activeUri = fs.readFileSync(activeUriFile, 'utf8').trim();
      if (activeUri) {
        await mongoose.connect(activeUri, { serverSelectionTimeoutMS: 1500 });
        console.log(`[Database] ✅ Connected to active running MongoDB at: ${activeUri}`);
        return;
      }
    } catch (activeErr) {
      // Stale active URI file, clean up
      try { fs.unlinkSync(activeUriFile); } catch (e) {}
    }
  }

  // 3. Try standard local daemon
  try {
    await mongoose.connect(defaultUri, { serverSelectionTimeoutMS: 1500 });
    console.log(`[Database] MongoDB Connected: ${mongoose.connection.host}`);
    return;
  } catch (err) {
    // 4. Start local embedded engine
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting local embedded database engine...');
        const dataDir = path.resolve('E:/temp/mongo-data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        process.env.TEMP = 'E:\\temp';
        process.env.TMP = 'E:\\temp';

        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create({
          instance: {
            dbPath: dataDir,
            dbName: 'cosathi',
          },
        });

        const memoryUri = mongod.getUri();
        fs.writeFileSync(activeUriFile, memoryUri, 'utf8');

        await mongoose.connect(memoryUri);
        console.log(`[Database] ✅ Connected to Embedded Database at: ${memoryUri}`);
      } catch (memErr) {
        console.error('[Database] Embedded database startup error:', memErr.message);
        throw memErr;
      }
    } else {
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    try {
      await mongod.stop();
      if (fs.existsSync(activeUriFile)) {
        fs.unlinkSync(activeUriFile);
      }
    } catch (e) {}
  }
};

module.exports = { connectDB, disconnectDB };
