import winston from "winston";
import config from "../config/index.js";
import asyncLocalStorage from "./requestContext.js";

const correlatiodIdFormat = winston.format((info) => {
  const store = asyncLocalStorage.getStore();

  if (store?.correlationId) {
    info.correlationId = store.correlationId;
  }
  return info;
});

const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",

  defaultMeta: {
    service: config.serviceName,
    environment: config.nodeEnv,
  },

  format: winston.format.combine(
    winston.format.timestamp(),
    correlatiodIdFormat(),
    winston.format.json(),
  ),

  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/combine.log" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/debug.log", level: "debug" }),
    new winston.transports.File({filename: "logs/warn.log", level: "warn"})
  ],
});

export default logger;
