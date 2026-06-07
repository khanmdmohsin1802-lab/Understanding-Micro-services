import "dotenv/config";
import config from "./config/index.js";
import express from "express";
import { connectDB, disconnectDB } from "./config/db.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import AppError from "./errors/appError.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import correlationIdMiddleware from "./middlewares/correlationId.js";
import asyncLocalStorage from "./utils/requestContext.js";
import { process } from "zod/v4/core";

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

await connectDB();

// 404 error handler
app.use((req, res, next) => {
  next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404));
});

// Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info("Catalog service started", {
    port: PORT,
    url: `http://localhost:${PORT}`,
  });
});

const gracefulShutdown = (signal) => {
  logger.warn(`${signal} signal received !`);

  server.close(async () => {
    logger.info("HTTP connection closed");

    try {
      await disconnectDB();

      logger.info("Graceful shutdown complete, Exiting the process");
      process.exit(0);
    } catch (error) {
      logger.error(`Error during Graceful Shutdown ${error.message}`);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Exiting forcefully, Could not close in Time");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
