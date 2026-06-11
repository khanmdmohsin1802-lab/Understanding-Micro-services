import bookingService from "../services/bookingService.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createBookingController = asyncHandler(async (req, res) => {
  const { eventId, userId, ticketCount } = req.body;

  const booking = await bookingService.createBooking({
    eventId,
    userId,
    ticketCount,
  });

  res
    .status(201)
    .json(new ApiResponse(200, "Booking created successfully", booking));
});

const getBookingByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await bookingService.getBookingById(id);

  res
    .status(201)
    .json(new ApiResponse(201, "Booking retrived Successfully", booking));
});

export { createBookingController, getBookingByIdController };
