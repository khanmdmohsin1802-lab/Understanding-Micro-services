import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(`Error message: ${err.message} \nstack: ${err.stack}`);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
};
