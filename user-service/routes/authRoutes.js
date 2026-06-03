import express from "express";
import {
  registerUserController,
  loginUserController,
} from "../controllers/authController.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  registerUserController,
);
router.post("/login", validateRequest(loginSchema), loginUserController);

export default router;
