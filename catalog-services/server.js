import "dotenv/config";
import config from "./config/index.js";
import express from "express";
import { connectDB, disconnectDB, getDbReadyState } from "./config/db.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import AppError from "./errors/appError.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import correlationIdMiddleware from "./middlewares/correlationId.js";
import asyncLocalStorage from "./utils/requestContext.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import helmet from "helmet";

let isReady = false;

const app = express();

app.use(helmet());

app.use(correlationIdMiddleware);

app.use(globalLimiter);

app.use(express.json());

if (config.enableRequestLogging) {
  app.use(requestLogger);
}

// ------ testing routes ------
app.get("/health/live", async (req, res) => {
  logger.info("The Server is live and running");
  res
    .status(200)
    .json({ success: true, message: "The server is Live, up and running" });
});

app.get("/health/ready", async (req, res) => {
  const result = getDbReadyState();
  if (!isReady || result !== 1) {
    logger.warn("Mongoose Database not connected", {
      readyState: result,
      isReady: isReady,
    });
    return res.status(503).json({
      success: false,
      status: "unhealthy",
      service: config.serviceName,
      timestamp: new Date().toISOString(),
      checks: {
        database: "disconnected",
      },
    });
  }

  logger.info("The server is in the Ready State");
  res.status(200).json({
    success: true,
    status: "healthy",
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    checks: { database: "connected" },
  });
});

// catalog routes
app.use("/api/v1/catalog", catalogRoutes);

const PORT = config.port;

isReady = await connectDB();

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
  isReady = false;
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
