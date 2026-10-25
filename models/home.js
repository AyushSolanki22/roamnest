
const mongoose = require("mongoose");

// _id is automatically added by mongoose
const homeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
    min: [0, "Nightly price cannot be negative."],
    validate: {
      validator: Number.isFinite,
      message: "Nightly price must be a valid number.",
    },
  },

  // Number of guests included in the base nightly price.
  // Hosts can set this to 2 or to the property's full capacity.
  includedGuests: {
    type: Number,
    required: true,
    default: 2,
    min: [1, "At least one guest must be included in the base price."],
    validate: {
      validator: Number.isInteger,
      message: "Included guests must be a whole number.",
    },
  },

  // Maximum number of guests allowed for this property.
  maxGuests: {
    type: Number,
    required: true,
    min: [1, "A property must accommodate at least one guest."],
    default: 1,
    validate: {
      validator: Number.isInteger,
      message: "Maximum guests must be a whole number.",
    },
  },

  // Fee charged per additional guest, per night.
  extraGuestFee: {
    type: Number,
    required: true,
    min: [0, "Extra guest fee cannot be negative."],
    default: 0,
    validate: {
      validator: Number.isFinite,
      message: "Extra guest fee must be a valid number.",
    },
  },

  location: {
    type: String,
    required: true,
    trim: true,
  },

  // Legacy field retained for existing documents only. Public ratings are
  // calculated from Review documents and must never be supplied by hosts.
  rating: {
    type: Number,
    min: [0, "Legacy rating cannot be below 0."],
    max: [5, "Legacy rating cannot exceed 5."],
    select: false,
  },

  photo: {
    type: String,
    required: true,
  },

  photoPublicId: {
    type: String,
    default: null,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  houseRules: {
    type: String,
    default: null,
  },

  houseRulesPublicId: {
    type: String,
    default: null,
  },

  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Ensure the included guest count never exceeds property capacity.
homeSchema.pre("validate", function () {
  if (
    Number.isInteger(this.includedGuests) &&
    Number.isInteger(this.maxGuests) &&
    this.includedGuests > this.maxGuests
  ) {
    this.invalidate(
      "includedGuests",
      "Included guests cannot exceed the property's maximum capacity."
    );
  }
});

// homeSchema.pre("findOneAndDelete", async function (next) {
//   const homeId = this.getQuery()["_id"];
//   const Favourite = require("./favourites");
//   await Favourite.deleteOne({ houseId: homeId });
// });

module.exports = mongoose.model("Home", homeSchema);
