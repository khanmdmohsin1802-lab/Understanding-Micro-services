import db from "../config/db.js";

const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { getProfile };
