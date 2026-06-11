import bookingRepository from "../repositories/bookingRepository.js";
import AppError from "../errors/AppError.js";

class BookingService {
  async createBooking(data) {
    // we will call the Catalog Service here to check if the event exists
    // and if there are enough availableSeats.

    const price = 100;
    const totalPrice = data.ticketCount * price;

    const bookingData = {
      eventId: data.eventId,
      userId: data.userId,
      ticketCount: data.ticketCount,
      totalPrice: totalPrice,
      status: "CONFIRMED",
    };

    const newBooking = await bookingRepository.createBooking(bookingData);

    return newBooking;
  }

  async getBookingById(id) {
    const booking = await bookingRepository.getBookingById(id);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    return booking;
  }
}

export default BookingService();
