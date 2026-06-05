import "dotenv/config";

const config = {
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV,
  serviceName: process.env.SERVICE_NAME,
};

export default config;
