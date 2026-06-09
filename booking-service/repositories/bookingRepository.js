import { prisma } from "../config/db.js";

class BookingRepository {
  async createBooking(bookingData) {
    return await prisma.booking.create({
      data: bookingData,
    });
  }

  async getBookingById(id) {
    return await prisma.booking.findUnique({
      where: { id },
    });
  }

  async updateBookingStatus(id, status) {
    return await prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
}

export default new BookingRepository();
