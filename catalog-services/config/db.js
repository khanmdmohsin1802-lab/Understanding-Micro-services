import mongoose from "mongoose";
import config from "./index.js";
import logger from "../utils/logger.js";
import "dotenv/config";

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: config.maxPoolSize,
    });
    logger.info("MongoDB connected successfully");
    return true;
  } catch (error) {
    logger.error("mongoDB connection error: ", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info("MongoDB connection closed successfully");
};

const getDbReadyState = () => {
  return mongoose.connection.readyState;
};

export { connectDB, disconnectDB, getDbReadyState };
