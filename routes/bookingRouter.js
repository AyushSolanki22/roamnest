const express = require("express");

const bookingRouter = express.Router();

const bookingController =
  require("../controllers/bookingController");

const requireLogin =
  require("../middleware/auth");

// Booking page
bookingRouter.get(
  "/book/:homeId",
  requireLogin,
  bookingController.getBooking
);

// Create booking
bookingRouter.post(
  "/book/:homeId",
  requireLogin,
  bookingController.postBooking
);

// Booking confirmation (must be owned by the signed-in guest)
bookingRouter.get(
  "/booking-confirmation/:bookingId",
  requireLogin,
  bookingController.getBookingConfirmation
);

// User bookings
bookingRouter.get(
  "/bookings",
  requireLogin,
  bookingController.getBookings
);

// Cancel booking
bookingRouter.post(
  "/cancel-booking/:bookingId",
  requireLogin,
  bookingController.postCancelBooking
);

bookingRouter.post(
  "/bookings/:bookingId/early-checkout",
  requireLogin,
  bookingController.postRequestEarlyCheckout
);


module.exports = bookingRouter;