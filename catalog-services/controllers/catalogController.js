import { getAllEvents, CreateNewEvents } from "../services/catalogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
// get handler
const getEvents = asyncHandler(async (req, res) => {
  const events = await getAllEvents();

  res
    .status(200)
    .json(new ApiResponse(200, "Event Fetched successfully", events));
});

const handleCreateEvents = asyncHandler(async (req, res) => {
  const eventData = req.body;

  const newEvent = await CreateNewEvents(eventData);

  res
    .status(201)
    .json(new ApiResponse(201, "Event Created Successfully", newEvent));
});

export { getEvents, handleCreateEvents };
