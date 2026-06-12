import winston from "winston";
import config from "../config/index.js";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),

  defaultMeta: {
    service: config.serviceName,
    environment: config.nodeEnv,
  },

  transports: [
    new winston.transports.File({ filename: "logs/combine.logs" }),
    new winston.transports.File({
      filename: "logs/error.logs",
      level: "error",
    }),
  ],
});

export default logger;
