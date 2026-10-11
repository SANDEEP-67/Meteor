const mongoose = require("mongoose");

const DEFAULT_MONGO_URI =
  "mongodb+srv://goswamisandeep7059_db_user:kbwflqDsRo58WiyV@cluster0.ziji6ai.mongodb.net";

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connect = async () => {
  // If connection is already open, return cached connection
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (cached.conn) {
    return cached.conn;
  }

  const uri =
    process.env.MONGO_URI || process.env.MONGOURI || DEFAULT_MONGO_URI;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("MongoDB connected");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connect;

