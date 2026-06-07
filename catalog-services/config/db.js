import mongoose from "mongoose";
import config from "./index.js";
import logger from "../utils/logger.js";
import "dotenv/config";

const connectDB = async () => {
  try {
    console.time("DB Connection Time");
    await mongoose.connect(config.mongoUri);
    console.timeEnd("DB Connection Time");

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("mongoDB connection error: ", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info("MongoDB connection closed successfully");
};

export { connectDB, disconnectDB };
