import "dotenv/config";
import express from "express";
import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "../catalog-services/middlewares/errorHandler.js";
import requestLogger from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";

const app = express();

app.use(express.json());

app.use(requestLogger);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

const PORT = process.env.PORT || 6001;

app.listen(PORT, () => {
  console.log(`User-Serive Server is running on: http://localhost:${PORT}`);
});

app.use(errorHandler);
