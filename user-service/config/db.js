import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool
  .connect()
  .then((client) => {
    console.log("Connected to PostgreSQL Database");
    client.release();
  })
  .catch((err) => console.error("Database connection error", err.stack));

export default pool;
