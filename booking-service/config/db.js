import { prismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const prisma = prismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("Postgress connected successfully via prisma");
    return true;
  } catch (error) {
    logger.error("postgress connection error", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info("Postgress connection close successfully");
};

export { prisma, connectDB, disconnectDB };
