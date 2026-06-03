import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import AppError from "./errors/appError.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import correlationId from "./middlewares/correlationId.js";

const app = express();
app.use(express.json());

app.use(correlationId);

app.use(requestLogger);

// ------ testing route ------
app.get("/health", (req, res) => {
  logger.info("health route was acsessed", {
    route: req.url,
  });
  logger.debug("debug log");
  res
    .status(200)
    .json({ message: "perfect", correlationId: req.correlationId });
});

app.use("/api/v1/catalog", catalogRoutes);

const PORT = process.env.PORT || 6002;

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
