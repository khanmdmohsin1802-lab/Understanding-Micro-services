import db from "../config/db.js";

const findUser = async (email) => {
  const result = await db.query(
    "SELECT id, role, email, password_hash FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
};

const createUser = async (email, passwordhash, role) => {
  const result = await db.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING email, id, role",
    [email, passwordhash, role || "customer"],
  );
  return result.rows[0];
};

export { findUser, createUser };
