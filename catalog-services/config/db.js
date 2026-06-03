import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    console.time("DB Connection Time");
    await mongoose.connect(process.env.MONGO_URI);
    console.timeEnd("DB Connection Time");

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("mongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
