import winston from "winston";

const logger = winston.createLogger({
  level: "debug",

  format: winston.format.combine(
    winston.format.timestamp(),

    winston.format.json(),
  ),

  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/combine.log" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/debug.log", level: "debug" }),
    new winston.transports.File({ filename: "logs/warn.log", level: "warn" }),
  ],
});

export default logger;
