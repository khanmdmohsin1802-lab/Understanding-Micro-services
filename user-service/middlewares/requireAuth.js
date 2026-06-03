import jwt from "jsonwebtoken";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized: Missing or Invalid token",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decode);
    req.user = decode;

    next();
  } catch (error) {
    res.status(403).json({ error: "Forbiden: Invalid or Expired token" });
  }
};

export { requireAuth };
