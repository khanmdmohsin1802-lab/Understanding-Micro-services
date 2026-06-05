import { ZodError } from "zod";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: err.issues.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      })),
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};

export { errorHandler };
