
const mongoose = require("mongoose");
const Review = require("../models/review");
const Booking = require("../models/booking");
const Home = require("../models/home");

exports.postReview = async (req, res, next) => {
  try {
    const { homeId } = req.params;
    const { bookingId, rating, comment } = req.body;
    const userId = req.session?.user?.id;

    if (
      !userId ||
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(homeId) ||
      typeof bookingId !== "string" ||
      !mongoose.isValidObjectId(bookingId)
    ) {
      return res.status(400).send("Invalid review submission.");
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).send("Rating must be between 1 and 5 stars.");
    }

    if (
      typeof comment !== "string" ||
      comment.trim().length < 10 ||
      comment.trim().length > 1000
    ) {
      return res.status(400).send(
        "Your review must contain between 10 and 1000 characters."
      );
    }

    const [home, booking] = await Promise.all([
      Home.findById(homeId).select("_id host"),
      Booking.findOne({
        _id: bookingId,
        home: homeId,
        user: userId,
        status: "confirmed",
        checkOut: { $lte: new Date() },
      }),
    ]);

    if (!home) {
      return res.status(404).send("Property not found.");
    }

    // Prevent hosts from reviewing their own properties
    if (home.host && home.host.toString() === userId.toString()) {
      return res.status(403).send("Hosts cannot review their own properties.");
    }

    if (!booking) {
      return res.status(403).send(
        "Only guests with a completed, non-cancelled stay can review this property."
      );
    }

    await Review.create({
      home: homeId,
      user: userId,
      booking: bookingId,
      rating: numericRating,
      comment: comment.trim(),
    });

    return res.redirect(`/homes/${homeId}?review=success`);
  } catch (error) {
    // The unique booking index prevents duplicate reviews,
    // including concurrent submissions.
    if (error.code === 11000) {
      return res.redirect(`/homes/${req.params.homeId}?review=duplicate`);
    }

    if (error.name === "ValidationError") {
      return res.status(400).send(error.message);
    }

    return next(error);
  }
};
