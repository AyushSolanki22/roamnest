const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Home = require("../models/home");

// ======================================================
// TRUEPRICE HELPERS
// ======================================================

// Work in integer paise for calculations, then convert to rupees only when
// persisting/displaying values. This avoids adding fractional rupees using
// binary floating-point arithmetic.
const toPaise = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return null;
  const paise = Math.round((numericAmount + Number.EPSILON) * 100);
  return Number.isSafeInteger(paise) ? paise : null;
};

const fromPaise = (paise) => paise / 100;

// Parse HTML date-input values strictly as YYYY-MM-DD.
const parseDateOnly = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

// Calculate nights using calendar dates.
const calculateNights = (startDate, endDate) => {
  const startDay = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const endDay = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  return (endDay - startDay) / (1000 * 60 * 60 * 24);
};

// Format a Date as a local YYYY-MM-DD calendar date.
// Avoid toISOString() because it can shift dates across time zones.
const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Redirect back to the booking page while preserving form inputs.
const redirectToBookingWithError = (
  res,
  homeId,
  message,
  formValues = {}
) => {
  const query = new URLSearchParams();

  query.set("error", message);

  if (formValues.checkIn) {
    query.set("checkIn", String(formValues.checkIn));
  }

  if (formValues.checkOut) {
    query.set("checkOut", String(formValues.checkOut));
  }

  if (
    formValues.guests !== undefined &&
    formValues.guests !== null &&
    String(formValues.guests).trim() !== ""
  ) {
    query.set("guests", String(formValues.guests));
  }

  return res.redirect(
    `/book/${homeId}?${query.toString()}`
  );
};

// ======================================================
// GET BOOKING PAGE
// ======================================================

exports.getBooking = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) {
      return res.redirect("/login");
    }

    const homeId = req.params.homeId;

    if (!mongoose.isValidObjectId(homeId)) {
      return res.status(400).send("Invalid home ID.");
    }

    const home = await Home.findById(homeId);

    if (!home) {
      return res.status(404).send("Home not found.");
    }

    // Host cannot book their own property.
    if (home.host.toString() === req.session.user.id.toString()) {
      return res.status(403).send(
        "You cannot book your own home."
      );
    }

    // Backward compatibility for older properties.
    const maxGuests = Number(home.maxGuests);
    const storedIncludedGuests = home.includedGuests;

    const includedGuests =
      storedIncludedGuests === undefined ||
      storedIncludedGuests === null
        ? Math.min(2, maxGuests)
        : Number(storedIncludedGuests);

    // Only accept valid date strings when restoring form inputs.
    const selectedCheckIn =
      typeof req.query.checkIn === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(req.query.checkIn)
        ? req.query.checkIn
        : "";

    const selectedCheckOut =
      typeof req.query.checkOut === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(req.query.checkOut)
        ? req.query.checkOut
        : "";

    const requestedGuests = Number(req.query.guests);

    const selectedGuests =
      req.query.guests !== undefined &&
      Number.isInteger(requestedGuests) &&
      requestedGuests >= 1 &&
      requestedGuests <= maxGuests
        ? requestedGuests
        : Math.min(includedGuests, maxGuests);

    // Allow only known, user-facing messages.
    const allowedErrors = new Set([
      "This home is already booked for the selected dates.",
      "Please enter valid check-in and check-out dates.",
      "Check-out date must be after check-in date.",
      "Check-in date cannot be in the past.",
      "Please select the number of guests.",
      "Invalid number of guests.",
      `This property allows a maximum of ${maxGuests} guests.`,
      "This property has invalid pricing. Please contact the host.",
      "Invalid number of nights.",
      "Unable to calculate the booking price. Please try again."
    ]);

    const bookingError =
      typeof req.query.error === "string" &&
      allowedErrors.has(req.query.error)
        ? req.query.error
        : "";

    // Fetch confirmed bookings whose checkout is still in the future.
    // The browser uses these ranges to warn about date conflicts.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingBookings = await Booking.find({
      home: homeId,
      status: "confirmed",
      checkOut: { $gt: today }
    })
      .select("checkIn checkOut -_id")
      .lean();

    // Keep date-only strings in local calendar format to avoid UTC shifts.
    const unavailableDateRanges = existingBookings.map((booking) => ({
      checkIn: formatDateOnly(new Date(booking.checkIn)),
      checkOut: formatDateOnly(new Date(booking.checkOut))
    }));

    return res.render("store/booking", {
      home,
      includedGuests,
      bookingError,
      unavailableDateRanges,
      selectedCheckIn,
      selectedCheckOut,
      selectedGuests,
      pageTitle: "Book Home",
      currPage: "bookings",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {}
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// POST BOOKING
// ======================================================

exports.postBooking = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) {
      return res.redirect("/login");
    }

    const homeId = req.params.homeId;
    const { checkIn, checkOut, guests } = req.body;

    const formValues = { checkIn, checkOut, guests };

    // --------------------------------------------------
    // FIND HOME
    // --------------------------------------------------

    if (!mongoose.isValidObjectId(homeId)) {
      return res.status(400).send("Invalid home ID.");
    }

    const home = await Home.findById(homeId);

    if (!home) {
      return res.status(404).send("Home not found.");
    }

    // --------------------------------------------------
    // PREVENT HOST FROM BOOKING OWN HOME
    // --------------------------------------------------

    if (home.host.toString() === req.session.user.id.toString()) {
      return res.status(403).send(
        "You cannot book your own home."
      );
    }

    // --------------------------------------------------
    // VALIDATE DATES
    // --------------------------------------------------

    const startDate = parseDateOnly(checkIn);
    const endDate = parseDateOnly(checkOut);

    if (!startDate || !endDate) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Please enter valid check-in and check-out dates.",
        formValues
      );
    }

    if (endDate <= startDate) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Check-out date must be after check-in date.",
        formValues
      );
    }

    // --------------------------------------------------
    // PREVENT PAST BOOKINGS
    // --------------------------------------------------

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Check-in date cannot be in the past.",
        formValues
      );
    }

    // --------------------------------------------------
    // VALIDATE GUESTS
    // --------------------------------------------------

    if (
      guests === undefined ||
      guests === null ||
      String(guests).trim() === ""
    ) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Please select the number of guests.",
        formValues
      );
    }

    const numberOfGuests = Number(guests);

    if (
      !Number.isInteger(numberOfGuests) ||
      numberOfGuests < 1
    ) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Invalid number of guests.",
        formValues
      );
    }

    // --------------------------------------------------
    // VALIDATE PROPERTY CAPACITY AND INCLUDED GUESTS
    // --------------------------------------------------

    const maxGuests = Number(home.maxGuests);

    if (
      !Number.isInteger(maxGuests) ||
      maxGuests < 1
    ) {
      return res.status(400).send(
        "This property has an invalid guest capacity. Please contact the host."
      );
    }

    if (numberOfGuests > maxGuests) {
      return redirectToBookingWithError(
        res,
        homeId,
        `This property allows a maximum of ${maxGuests} guests.`,
        formValues
      );
    }

    const storedIncludedGuests = home.includedGuests;

    const includedGuests =
      storedIncludedGuests === undefined ||
      storedIncludedGuests === null
        ? Math.min(2, maxGuests)
        : Number(storedIncludedGuests);

    if (
      !Number.isInteger(includedGuests) ||
      includedGuests < 1 ||
      includedGuests > maxGuests
    ) {
      return res.status(400).send(
        "This property has invalid included guest settings. Please contact the host."
      );
    }

    // --------------------------------------------------
    // VALIDATE PRICE VALUES
    // --------------------------------------------------

    // Always use server-side property values.
    const rawBasePrice = Number(home.price);
    const rawExtraGuestFee = Number(home.extraGuestFee ?? 0);
    const basePricePaise = toPaise(rawBasePrice);
    const extraGuestFeePaise = toPaise(rawExtraGuestFee);

    if (
      basePricePaise === null ||
      extraGuestFeePaise === null
    ) {
      return redirectToBookingWithError(
        res,
        homeId,
        "This property has invalid pricing. Please contact the host.",
        formValues
      );
    }

    // --------------------------------------------------
    // CALCULATE NUMBER OF NIGHTS
    // --------------------------------------------------

    const nights = calculateNights(startDate, endDate);

    if (!Number.isInteger(nights) || nights <= 0) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Invalid number of nights.",
        formValues
      );
    }

    // --------------------------------------------------
    // TRUEPRICE CALCULATION
    // --------------------------------------------------

    const extraGuests = Math.max(0, numberOfGuests - includedGuests);
    const baseAmountPaise = basePricePaise * nights;
    const extraGuestAmountPaise = extraGuests * extraGuestFeePaise * nights;
    const totalPricePaise = baseAmountPaise + extraGuestAmountPaise;

    if (
      !Number.isSafeInteger(baseAmountPaise) ||
      !Number.isSafeInteger(extraGuestAmountPaise) ||
      !Number.isSafeInteger(totalPricePaise)
    ) {
      return redirectToBookingWithError(
        res,
        homeId,
        "Unable to calculate the booking price. Please try again.",
        formValues
      );
    }

    // --------------------------------------------------
    // CHECK FOR BOOKING CONFLICT
    // --------------------------------------------------

    // Checkout on another booking's check-in date is allowed.
    // Overlapping confirmed bookings are rejected.
    const conflictingBooking = await Booking.findOne({
      home: homeId,
      status: "confirmed",
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate }
    });

    if (conflictingBooking) {
      return redirectToBookingWithError(
        res,
        homeId,
        "This home is already booked for the selected dates.",
        formValues
      );
    }

    // --------------------------------------------------
    // CREATE BOOKING
    // --------------------------------------------------

    const booking = new Booking({
      home: homeId,
      user: req.session.user.id,
      checkIn: startDate,
      checkOut: endDate,
      guests: numberOfGuests,
      nights,

      // Save a historical snapshot of the pricing.
      // Store currency values rounded to paise so every saved component
      // reconciles exactly with the saved total.
      basePrice: fromPaise(basePricePaise),
      includedGuests,
      extraGuestFee: fromPaise(extraGuestFeePaise),
      extraGuests,
      baseAmount: fromPaise(baseAmountPaise),
      extraGuestAmount: fromPaise(extraGuestAmountPaise),
      totalPrice: fromPaise(totalPricePaise),

      status: "confirmed"
    });

    // --------------------------------------------------
    // SAVE BOOKING
    // --------------------------------------------------

    await booking.save();

    // --------------------------------------------------
    // REDIRECT TO BOOKINGS
    // --------------------------------------------------

    return res.redirect(`/booking-confirmation/${booking._id}`);
  } catch (error) {
    next(error);
  }
};

// ======================================================
// BOOKING CONFIRMATION
// ======================================================

exports.getBookingConfirmation = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) {
      return res.redirect("/login");
    }

    const bookingId = req.params.bookingId;
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).send("Invalid booking ID.");
    }

    // A guest may only view their own booking confirmation.
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.session.user.id
    }).populate("home");

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    return res.render("store/booking-confirmation", {
      booking,
      pageTitle: "Booking Confirmation",
      currPage: "bookings",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {}
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET MY BOOKINGS
// ======================================================

exports.getBookings = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) {
      return res.redirect("/login");
    }

    const bookings = await Booking.find({
      user: req.session.user.id
    })
      .populate("home")
      .sort({ createdAt: -1 });

    return res.render("store/bookings", {
      bookings,
      pageTitle: "My Bookings",
      currPage: "bookings",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {}
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// CANCEL BOOKING
// ======================================================

exports.postCancelBooking = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) {
      return res.redirect("/login");
    }

    const bookingId = req.params.bookingId;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).send("Invalid booking ID.");
    }

    // Only find confirmed bookings owned by the logged-in user.
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.session.user.id,
      status: "confirmed"
    });

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    booking.status = "cancelled";

    await booking.save();

    return res.redirect("/bookings");
  } catch (error) {
    next(error);
  }
};