import winston from "winston";
import asyncLocalStorage from "./requestContext.js";

const correlatiodIdFormate = winston.format((info) => {
  const store = asyncLocalStorage.getStore();

  if (store?.correlationId) {
    info.correlationId = store.correlationId;
  }
  return info;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  defaultMeta: {
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV,
  },

  format: winston.format.combine(
    winston.format.timestamp(),
    correlatiodIdFormate(),
    winston.format.json(),
  ),

  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/combine.log" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/debug.log", level: "debug" }),
  ],
});

export default logger;
