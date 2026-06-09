import winston from "winston";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),

  transports: [
    new winston.transports.File({ filename: "logs/combine.logs" }),
    new winston.transports.File({ filename: "logs/error.logs", level: error }),
  ],
});

export default logger;
