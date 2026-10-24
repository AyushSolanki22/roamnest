const Home = require("../models/home");
const mongoose = require("mongoose");

const Booking = require("../models/booking");

const {
  cloudinary,
  uploadImage,
  uploadHouseRules,
} = require("../utils/cloudinary");


const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) return;

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (!["ok", "not found"].includes(result.result)) {
    throw new Error(
      `Cloudinary deletion failed for ${publicId}`
    );
  }
};



// --------------------------------------------------
// Find home only if it belongs to the logged-in host
// --------------------------------------------------

const getOwnedHome = async (homeId, userId) => {
  if (
    !mongoose.isValidObjectId(homeId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    return null;
  }

  return Home.findOne({
    _id: homeId,
    host: userId,
  });
};


// --------------------------------------------------
// GET ADD HOME
// --------------------------------------------------

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home",
    currPage: "addHome",
    editing: false,
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user || {}
  });
};


// --------------------------------------------------
// GET EDIT HOME
// --------------------------------------------------

exports.getEditHome = async (req, res, next) => {
  try {

    const homeId = req.params.homeId;

    const home = await getOwnedHome(
      homeId,
      req.session.user.id
    );

    if (!home) {
      return res.status(404).send(
        "Home not found or you are not authorized."
      );
    }

    res.render("host/edit-home", {
      home,
      editing: true, 
      pageTitle: "Add Home",
      currPage: "addHome", 
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {},
    });

  } catch (error) {
    next(error);
  }
};


// --------------------------------------------------
// POST ADD HOME
// --------------------------------------------------


exports.postAddHome = async (req, res, next) => {
  const uploadedAssets = [];

  try {
    const {
      houseName,
      housePrice,
      maxGuests,
      extraGuestFee,
      houseLocation,
      houseRating,
      description,
    } = req.body || {};

    const photoFile = req.files?.photo?.[0];
    const rulesFile = req.files?.houseRules?.[0];

    if (!photoFile) {
      return res.status(400).send("Please upload a home photo.");
    }

    // Upload property photo
    const photoResult = await uploadImage(photoFile);
    uploadedAssets.push({
      publicId: photoResult.public_id,
      resourceType: "image",
    });

    // Upload PDF only when supplied
    let rulesResult = null;

    if (rulesFile) {
      rulesResult = await uploadHouseRules(rulesFile);

      uploadedAssets.push({
        publicId: rulesResult.public_id,
        resourceType: "image",
      });
    }

    const home = new Home({
      name: houseName,
      price: Number(housePrice),
      maxGuests: Number(maxGuests),
      extraGuestFee: Number(extraGuestFee),
      location: houseLocation,
      rating: Number(houseRating),

      photo: photoResult.secure_url,
      photoPublicId: photoResult.public_id,

      houseRules: rulesResult
        ? rulesResult.secure_url
        : null,
      houseRulesPublicId: rulesResult
        ? rulesResult.public_id
        : null,

      description: description || "",
      host: req.session.user.id,
    });

    await home.save();

    res.redirect("/host/host-homes");
  } catch (error) {
    // Remove newly uploaded Cloudinary assets if saving fails
    // Remove newly uploaded Cloudinary assets if saving fails
// Remove newly uploaded Cloudinary assets if saving fails.
for (const asset of uploadedAssets) {
  try {
    await deleteCloudinaryAsset(asset.publicId);
  } catch (cleanupError) {
    console.error("Cloudinary cleanup failed:", cleanupError);

}
}

    next(error);
  }
};


// --------------------------------------------------
// POST EDIT HOME
// --------------------------------------------------


exports.postEditHome = async (req, res, next) => {
  const newAssets = [];

  try {
    const {
      houseName,
      housePrice,
      maxGuests,
      extraGuestFee,
      houseLocation,
      houseRating,
      description,
    } = req.body || {};

    const existingHome = await getOwnedHome(
      req.params.homeId,
      req.session.user.id
    );

    if (!existingHome) {
      return res.status(404).send(
        "Home not found or you are not authorized."
      );
    }

    const photoFile = req.files?.photo?.[0];
    const rulesFile = req.files?.houseRules?.[0];

    // Preserve old Cloudinary IDs before changing anything
    const oldPhotoPublicId = existingHome.photoPublicId;
    const oldRulesPublicId = existingHome.houseRulesPublicId;

    // Upload replacements first
    let photoResult = null;
    let rulesResult = null;

    if (photoFile) {
      photoResult = await uploadImage(photoFile);

      newAssets.push(photoResult.public_id);
    }

    if (rulesFile) {
      rulesResult = await uploadHouseRules(rulesFile);

      newAssets.push(rulesResult.public_id);
    }

    // Update regular fields
    existingHome.name = houseName;
    existingHome.price = Number(housePrice);
    existingHome.maxGuests = Number(maxGuests);
    existingHome.extraGuestFee = Number(extraGuestFee);
    existingHome.location = houseLocation;
    existingHome.rating = Number(houseRating);
    existingHome.description = description || "";

    // Update photo only if a replacement was uploaded
    if (photoResult) {
      existingHome.photo = photoResult.secure_url;
      existingHome.photoPublicId = photoResult.public_id;
    }

    // Update PDF only if a replacement was uploaded
    if (rulesResult) {
      existingHome.houseRules = rulesResult.secure_url;
      existingHome.houseRulesPublicId = rulesResult.public_id;
    }

    // Save database changes before deleting old assets
    await existingHome.save();

    // Best-effort cleanup of replaced assets
    if (photoResult && oldPhotoPublicId) {
      try {
        await deleteCloudinaryAsset(oldPhotoPublicId);
      } catch (cleanupError) {
        console.error("Old photo cleanup failed:", cleanupError);
      }
    }

    if (rulesResult && oldRulesPublicId) {
      try {
        await deleteCloudinaryAsset(oldRulesPublicId);
      } catch (cleanupError) {
        console.error("Old PDF cleanup failed:", cleanupError);
      }
    }

    return res.redirect("/host/host-homes");
  } catch (error) {
    // Remove new uploads if the operation failed
    for (const publicId of newAssets) {
      try {
        await deleteCloudinaryAsset(publicId);
      } catch (cleanupError) {
        console.error("New asset cleanup failed:", cleanupError);
      }
    }

    next(error);
  }
};



// --------------------------------------------------
// DELETE HOME
// --------------------------------------------------


exports.postDeleteHome = async (req, res, next) => {
  try {
    const home = await getOwnedHome(
      req.params.homeId,
      req.session.user.id
    );

    if (!home) {
      return res.status(404).send(
        "Home not found or you are not authorized."
      );
    }

    // Keep IDs before deleting the MongoDB document
    const photoPublicId = home.photoPublicId;
    const rulesPublicId = home.houseRulesPublicId;

    // Delete database record first
    await Home.findByIdAndDelete(home._id);

    // Clean up Cloudinary assets
    for (const publicId of [photoPublicId, rulesPublicId]) {
      if (!publicId) continue;

      try {
        await deleteCloudinaryAsset(publicId);
      } catch (cleanupError) {
        console.error(
          `Cloudinary cleanup failed for ${publicId}:`,
          cleanupError
        );
      }
    }

    return res.redirect("/host/host-homes");
  } catch (error) {
    next(error);
  }
};




exports.getHostHomes = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find({
      host: req.session.user.id,
    });

    res.render("host/host-home-list", {
      registeredHomes,
      pageTitle: "Host Homes",
      currPage: "hostHomes",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {},
    });
  } catch (error) {
    next(error);
  }
};

const parseHostDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const hostNightsBetween = (start, end) => {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endUtc = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return (endUtc - startUtc) / 86400000;
};

const hostToPaise = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100);

const hostFromPaise = (value) => value / 100;



exports.getEarlyCheckoutRequests = async (req, res, next) => {
  try {
    const homes = await Home.find({
      host: req.session.user.id,
    }).select("_id name");

    const homeIds = homes.map((home) => home._id);

    const requests = await Booking.find({
      home: { $in: homeIds },
      status: "confirmed",
      "earlyCheckout.requestStatus": "pending",
    })
      .populate("home", "name location")
      .populate("user", "firstName")
      .sort({ "earlyCheckout.requestedAt": 1 });

    return res.render("host/early-checkout-requests", {
      requests,
      pageTitle: "Early Checkout Requests",
      currPage: "host-homes",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {},
    });
  } catch (error) {
    next(error);
  }
};


exports.postApproveEarlyCheckout = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const hostId = req.session.user.id;
    const refundInput = req.body.approvedRefund;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).send("Invalid booking ID.");
    }

    if (
      refundInput === undefined ||
      String(refundInput).trim() === ""
    ) {
      return res.status(400).send("Please enter an approved refund amount.");
    }

    const requestedRefund = Number(refundInput);

    if (
      !Number.isFinite(requestedRefund) ||
      requestedRefund < 0
    ) {
      return res.status(400).send("Invalid refund amount.");
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      status: "confirmed",
      "earlyCheckout.requestStatus": "pending",
    });

    if (!booking) {
      return res.status(404).send("Pending request not found.");
    }

    const home = await Home.findOne({
      _id: booking.home,
      host: hostId,
    });

    if (!home) {
      return res.status(403).send(
        "You are not authorized to decide this request."
      );
    }

    const refundPaise = hostToPaise(requestedRefund);
    const eligibleRefundPaise = hostToPaise(
      booking.earlyCheckout.eligibleRefund
    );

    if (
      !Number.isSafeInteger(refundPaise) ||
      refundPaise < 0 ||
      refundPaise > eligibleRefundPaise
    ) {
      return res.status(400).send(
        "The approved refund must be between ₹0 and the eligible refund amount."
      );
    }

    const now = new Date();
    const oldCheckIn = parseHostDate(booking.checkIn);
    const oldCheckOut = parseHostDate(booking.checkOut);
    const newCheckOut = parseHostDate(
      booking.earlyCheckout.requestedCheckOut
    );

    if (!oldCheckIn || !oldCheckOut || !newCheckOut) {
      return res.status(400).send("Booking dates are invalid.");
    }

    if (
      newCheckOut <= oldCheckIn ||
      newCheckOut >= oldCheckOut ||
      newCheckOut <= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    ) {
      return res.status(400).send(
        "The requested checkout date is no longer valid."
      );
    }

    // Recheck overlap before applying the shorter stay.
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      home: booking.home,
      status: "confirmed",
      checkIn: { $lt: newCheckOut },
      checkOut: { $gt: oldCheckIn },
    }).select("_id");

    if (conflictingBooking) {
      return res.status(409).send(
        "The adjusted stay conflicts with another confirmed booking."
      );
    }

    const newNights = hostNightsBetween(oldCheckIn, newCheckOut);

    if (!Number.isInteger(newNights) || newNights < 1) {
      return res.status(400).send("Invalid adjusted stay duration.");
    }

    const baseNightPaise = hostToPaise(booking.basePrice);
    const extraNightPaise =
      hostToPaise(booking.extraGuestFee) * booking.extraGuests;

    const newBaseAmountPaise = baseNightPaise * newNights;
    const newExtraAmountPaise = extraNightPaise * newNights;
    const newTotalPaise =
      newBaseAmountPaise + newExtraAmountPaise;

    if (
      !Number.isSafeInteger(newBaseAmountPaise) ||
      !Number.isSafeInteger(newExtraAmountPaise) ||
      !Number.isSafeInteger(newTotalPaise)
    ) {
      return res.status(400).send(
        "Unable to recalculate the adjusted booking price."
      );
    }

    // Preserve original details before changing the booking.
    booking.earlyCheckout.originalBooking = {
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      baseAmount: booking.baseAmount,
      extraGuestAmount: booking.extraGuestAmount,
      totalPrice: booking.totalPrice,
    };

    booking.checkOut = newCheckOut;
    booking.nights = newNights;
    booking.baseAmount = hostFromPaise(newBaseAmountPaise);
    booking.extraGuestAmount = hostFromPaise(newExtraAmountPaise);
    booking.totalPrice = hostFromPaise(newTotalPaise);

    booking.earlyCheckout.requestStatus = "approved";
    booking.earlyCheckout.decidedAt = new Date();
    booking.earlyCheckout.decidedBy = hostId;
    booking.earlyCheckout.approvedRefund = hostFromPaise(refundPaise);
    booking.earlyCheckout.refundStatus =
      refundPaise > 0
        ? "approved_pending_payment"
        : "not_applicable";

    await booking.save();

    return res.redirect("/host/early-checkout-requests");
  } catch (error) {
    next(error);
  }
};



exports.postRejectEarlyCheckout = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const hostId = req.session.user.id;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).send("Invalid booking ID.");
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      status: "confirmed",
      "earlyCheckout.requestStatus": "pending",
    });

    if (!booking) {
      return res.status(404).send("Pending request not found.");
    }

    const home = await Home.findOne({
      _id: booking.home,
      host: hostId,
    });

    if (!home) {
      return res.status(403).send(
        "You are not authorized to decide this request."
      );
    }

    booking.earlyCheckout.requestStatus = "rejected";
    booking.earlyCheckout.decidedAt = new Date();
    booking.earlyCheckout.decidedBy = hostId;
    booking.earlyCheckout.decisionNote =
      typeof req.body.decisionNote === "string"
        ? req.body.decisionNote.trim().slice(0, 1000)
        : "";
    booking.earlyCheckout.approvedRefund = null;
    booking.earlyCheckout.refundStatus = "not_applicable";

    await booking.save();

    return res.redirect("/host/early-checkout-requests");
  } catch (error) {
    next(error);
  }
};
