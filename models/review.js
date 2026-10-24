
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    home: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },

    rating: {
      type: Number,
      required: [true, "Please provide a rating."],
      min: [1, "Rating must be at least 1 star."],
      max: [5, "Rating cannot exceed 5 stars."],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5.",
      },
    },

    comment: {
      type: String,
      required: [true, "Please write a review."],
      trim: true,
      minlength: [10, "Review must contain at least 10 characters."],
      maxlength: [1000, "Review cannot exceed 1000 characters."],
    },
  },
  { timestamps: true }
);

// Efficiently retrieve a property's reviews, newest first.
reviewSchema.index({ home: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
