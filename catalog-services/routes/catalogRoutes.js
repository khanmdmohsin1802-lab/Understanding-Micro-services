import express from "express";
import {
  getEvents,
  handleCreateEvents,
} from "../controllers/catalogController.js";
import validateRequest from "../middlewares/validateRequest.js";
import { createEventSchema } from "../schemas/catalogSchema.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.get("/", getEvents);

router.post(
  "/",
  writeLimiter,
  validateRequest(createEventSchema),
  handleCreateEvents,
);

export default router;
