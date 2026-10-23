
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
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

    checkIn: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.checkOut || value < this.checkOut;
        },
        message: "Check-in must be before check-out.",
      },
    },

    checkOut: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.checkIn || value > this.checkIn;
        },
        message: "Check-out must be after check-in.",
      },
    },

    guests: {
      type: Number,
      required: true,
      min: [1, "At least one guest is required."],
      validate: {
        validator: Number.isInteger,
        message: "Number of guests must be a whole number.",
      },
    },

    nights: {
      type: Number,
      required: true,
      min: [1, "A booking must be for at least one night."],
      validate: {
        validator: Number.isInteger,
        message: "Number of nights must be a whole number.",
      },
    },

    // Historical snapshot: nightly price when the booking was created.
    // Keep this independent of the home's current price.
    basePrice: {
      type: Number,
      required: true,
      min: [0, "Nightly price cannot be negative."],
      validate: {
        validator: Number.isFinite,
        message: "Nightly price must be a valid number.",
      },
    },

    // Historical snapshot: number of guests included in the base price.
    includedGuests: {
      type: Number,
      required: true,
      min: [1, "At least one guest must be included in the base price."],
      validate: {
        validator: Number.isInteger,
        message: "Included guests must be a whole number.",
      },
    },

    // Historical snapshot: extra guest fee per guest, per night.
    extraGuestFee: {
      type: Number,
      required: true,
      min: [0, "Extra guest fee cannot be negative."],
      validate: {
        validator: Number.isFinite,
        message: "Extra guest fee must be a valid number.",
      },
    },

    // Number of guests charged beyond the included guest count.
    extraGuests: {
      type: Number,
      required: true,
      min: [0, "Extra guests cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Extra guests must be a whole number.",
      },
    },

    // Saved accommodation subtotal for the original booking.
    // This is basePrice multiplied by nights.
    baseAmount: {
      type: Number,
      required: true,
      min: [0, "Accommodation amount cannot be negative."],
      validate: {
        validator: Number.isFinite,
        message: "Accommodation amount must be a valid number.",
      },
    },

    // Saved total extra guest charges for the original booking.
    // This is extraGuests multiplied by extraGuestFee and nights.
    extraGuestAmount: {
      type: Number,
      required: true,
      min: [0, "Extra guest amount cannot be negative."],
      validate: {
        validator: Number.isFinite,
        message: "Extra guest amount must be a valid number.",
      },
    },

    // Final booking price saved at booking time.
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative."],
      validate: {
        validator: Number.isFinite,
        message: "Total price must be a valid number.",
      },
    },

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      index: true,
    },
  },
  { timestamps: true }
);


bookingSchema.pre("validate", function (next) {
  const values = [
    this.basePrice,
    this.extraGuestFee,
    this.baseAmount,
    this.extraGuestAmount,
    this.totalPrice,
  ];

  if (!values.every(Number.isFinite)) {
    return next(new Error("Booking pricing values must be finite numbers."));
  }

  // Compare amounts in integer paise to avoid floating-point discrepancies.
  const toPaise = (amount) => Math.round((amount + Number.EPSILON) * 100);

  const expectedBaseAmount = toPaise(this.basePrice) * this.nights;
  const expectedExtraAmount =
    toPaise(this.extraGuestFee) * this.extraGuests * this.nights;

  if (
    !Number.isSafeInteger(expectedBaseAmount) ||
    !Number.isSafeInteger(expectedExtraAmount) ||
    !Number.isSafeInteger(expectedBaseAmount + expectedExtraAmount)
  ) {
    return next(new Error("Booking pricing exceeds supported limits."));
  }

  if (
    toPaise(this.baseAmount) !== expectedBaseAmount ||
    toPaise(this.extraGuestAmount) !== expectedExtraAmount ||
    toPaise(this.totalPrice) !== expectedBaseAmount + expectedExtraAmount
  ) {
    return next(new Error("Booking pricing breakdown does not match the total."));
  }

  next();
});


// Helpful compound index for finding overlapping confirmed bookings.
// This helps query performance but does not, by itself, prevent race conditions.
bookingSchema.index({
  home: 1,
  status: 1,
  checkIn: 1,
  checkOut: 1,
});

module.exports = mongoose.model("Booking", bookingSchema);
