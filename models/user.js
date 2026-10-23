const mongoose = require("mongoose");

// _id is automatically added by mongoose
const userSchema = mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  email: {
  type: String,
  required: true,
  trim: true,
  lowercase: true,
  unique: true,
},
  password: { type: String, required: true },
  userType: {
    type: String,
    required: true,
    enum: ["guest", "host"],
    default: "guest",
  },
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Home" }],  

  //favourites is an array.
  // Each item in it is an ObjectId.
  // Each ObjectId refers to a document in the Home model.

  //using populate, we get the full home details ,,, using User.findById().populate('favourites') --- it return user with full home details including in favourites ---- this is what populate do ---serving reference relationships basically 
});

module.exports = mongoose.model("User", userSchema);
