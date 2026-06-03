import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", requireAuth, getProfile);

//testing route
router.get("/", (req, res) => {
  res.json({ message: "hi" });
});

export default router;
