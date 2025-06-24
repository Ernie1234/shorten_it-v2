import mongoose from "mongoose";

interface ConnectOptions extends mongoose.ConnectOptions {
  dbName?: string;
}

/**
 * Connects to MongoDB using Mongoose.
 * @param mongoUri The MongoDB connection URI.
 * @param dbName Optional database name to connect to.
 */
export const connectDB = async (
  mongoUri: string,
  dbName?: string,
): Promise<void> => {
  try {
    const options: ConnectOptions = {};
    if (dbName) {
      options.dbName = dbName;
    }

    await mongoose.connect(mongoUri, options);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};
