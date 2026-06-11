import express from "express";
import {
  createBookingController,
  getBookingByIdController,
} from "../controllers/bookingController.js";

const router = express.Router();

router.get("/:id", getBookingByIdController);

router.post("/", createBookingController);

export default router;
