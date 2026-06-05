import config from "../config/index.js";
import { getAllEvents, CreateNewEvents } from "../services/catalogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { success } from "zod";

// get event
const getEvents = asyncHandler(async (req, res) => {
  const events = await getAllEvents();

  res
    .status(200)
    .json(new ApiResponse(200, "Event Fetched successfully", events));
});

// create event
const handleCreateEvents = asyncHandler(async (req, res) => {
  if (!config.enableCreateEvent) {
    return res.status(503).json({
      success: false,
      message: "Event creation is temporarily unavailable.",
    });
  }

  const eventData = req.body;

  const newEvent = await CreateNewEvents(eventData);

  res
    .status(201)
    .json(new ApiResponse(201, "Event Created Successfully", newEvent));
});

export { getEvents, handleCreateEvents };
