import mongoose from "mongoose";
import config from "./index.js";
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

export default connectDB;
