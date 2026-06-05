import "dotenv/config";
import config from "./config/index.js";
import express from "express";
import connectDB from "./config/db.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import AppError from "./errors/appError.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import correlationIdMiddleware from "./middlewares/correlationId.js";
import asyncLocalStorage from "./utils/requestContext.js";

const app = express();
app.use(express.json());

app.use(correlationIdMiddleware);

if (config.enableRequestLogging) {
  app.use(requestLogger);
}

// ------ testing route ------
app.get("/health", async (req, res) => {
  logger.info("Health route running perfectly");
  res.status(200).json({ message: "perfect" });
});

app.use("/api/v1/catalog", catalogRoutes);

const PORT = config.port;

connectDB();

// 404 error handler
app.use((req, res, next) => {
  next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404));
});

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Catalog-Service Server is running on port: ${PORT} and URL: http://localhost:${PORT}`,
  );
});
