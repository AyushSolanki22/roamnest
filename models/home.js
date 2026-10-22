const mongoose = require("mongoose");

// _id is automatically added by mongoose
const homeSchema = mongoose.Schema({
  name: { type: String, required: true },
  price: {
    type: Number,
    required: true,
    min: 0,
  },

  maxGuests: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },

  extraGuestFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  location: { type: String, required: true },
  rating: { type: Number, required: true },
  
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

// homeSchema.pre("findOneAndDelete", async function (next) {
//   const homeId = this.getQuery()["_id"];
//   const Favourite = require("./favourites");
//   await Favourite.deleteOne({ houseId: homeId });
// });

module.exports = mongoose.model("Home", homeSchema);
