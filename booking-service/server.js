import "dotenv/config";
import config from "./config/index.js";
import express from "express";
import { connectDB, disconnectDB } from "./config/db.js";
import bookingRoute from "./routes/bookingRoute.js";
import errorHandler from "./middlewares/errorHandler.js";
import AppError from "./errors/appError.js";
import ApiResponse from "./utils/apiResponse.js";
import logger from "./utils/logger.js";

let isReady = false;

const app = express();

app.use(express.json());

app.use("/api/v1/booking", bookingRoute);

app.get("/health/live", (req, res) => {
  logger.info("The server is helathy and Live");
  res.status(200).json(new ApiResponse(200, "Server is Alive"));
});

app.get("/health/ready", (req, res) => {
  if (!isReady) {
    logger.warn("The server is not Ready");
    return res.status(503).json({
      success: false,
      status: "Unhealthy",
      serivce: "booking-service",
      checks: {
        database: "disconnected",
      },
    });
  }

  logger.info("The server is healthy and Ready");
  res.status(200).json({
    success: false,
    status: "healthy",
    serivce: "booking-service",
    checks: {
      database: "connected",
    },
  });
});

app.use((req, res, next) => {
  next(new AppError(404, `cannot find the ${req.originalUrl} on this server`));
});

app.use(errorHandler);

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info("server started successfully", {
    PORT: PORT,
    url: `http://localhost:${PORT}`,
  });
});

const gracefulShutdown = (signal) => {
  isReady = false;
  logger.warn(`Server recived ${signal} signal`);
  server.close(async () => {
    await disconnectDB();
    logger.info("Graceful shutdown completed successfully");
    process.exit(1);
  });
  setTimeout(() => {
    logger.error("Forcing shutdown");
    process.exit(0);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
