const Home = require("../models/home");
const User = require("../models/user");
const Review = require("../models/review");
const Booking = require("../models/booking");

const mongoose = require("mongoose");


// Keep search inputs small and predictable before they reach MongoDB.
const MAX_SEARCH_LENGTH = 80;
const MAX_PRICE = 10000000;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function attachGuestRatings(homes) {
  if (!homes.length) return homes;
  const summaries = await Review.aggregate([
    { $match: { home: { $in: homes.map((home) => home._id) } } },
    { $group: { _id: "$home", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);
  const byHome = new Map(summaries.map((item) => [String(item._id), item]));
  return homes.map((home) => {
    const summary = byHome.get(String(home._id));
    return { ...home, averageRating: summary ? Math.round(summary.averageRating * 10) / 10 : null, reviewCount: summary ? summary.reviewCount : 0 };
  });
}

const parseOptionalNumber = (value, { min = 0, max = MAX_PRICE, integer = false } = {}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    return null;
  }
  return parsed;
};

exports.getHomes = async (req, res, next) => {
  try {
    const rawSearch = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const search = rawSearch.slice(0, MAX_SEARCH_LENGTH);
    const minPrice = parseOptionalNumber(req.query.minPrice);
    const maxPrice = parseOptionalNumber(req.query.maxPrice);
    const guests = parseOptionalNumber(req.query.guests, { min: 1, max: 100, integer: true });
    const allowedSorts = new Set(["recommended", "price-asc", "price-desc", "rating-desc", "newest"]);
    const sort = typeof req.query.sort === "string" && allowedSorts.has(req.query.sort)
      ? req.query.sort
      : "recommended";

    const filter = {};
    if (search) {
      const safeSearch = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: safeSearch }, { location: safeSearch }];
    }

    const priceRange = {};
    if (minPrice !== null) priceRange.$gte = minPrice;
    if (maxPrice !== null) priceRange.$lte = maxPrice;
    if (Object.keys(priceRange).length) filter.price = priceRange;
    if (guests !== null) filter.maxGuests = { $gte: guests };

    // If the user enters a valid minimum above their maximum, return no results
    // rather than silently reversing their intended range.
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      filter._id = { $exists: false };
    }

    const sortOptions = {
      "price-asc": { price: 1, _id: -1 },
      "price-desc": { price: -1, _id: -1 },
      newest: { _id: -1 },
    };

    let registeredHomes = await Home.find(filter)
      .sort(sortOptions[sort] || { _id: -1 })
      .lean();
    registeredHomes = await attachGuestRatings(registeredHomes);
    if (sort === "rating-desc" || sort === "recommended") {
      registeredHomes.sort((a, b) =>
        (b.averageRating ?? -1) - (a.averageRating ?? -1) ||
        String(b._id).localeCompare(String(a._id))
      );
    }
    const searchState = {
      q: search,
      minPrice: minPrice === null ? "" : String(minPrice),
      maxPrice: maxPrice === null ? "" : String(maxPrice),
      guests: guests === null ? "" : String(guests),
      sort,
    };

    res.render("store/home-list", {
      registeredHomes,
      searchState,
      resultCount: registeredHomes.length,
      hasSearch: Boolean(search || minPrice !== null || maxPrice !== null || guests !== null),
      pageTitle: "Explore Stays | Roamnest",
      currPage: "Home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {},
    });
  } catch (error) {
    next(error);
  }
};


exports.getIndex = async (req, res, next) => {
  try {
    const registeredHomes = await attachGuestRatings(await Home.find().lean());

    return res.render("store/index", {
      registeredHomes,
      pageTitle: "RoamNest Home",
      currPage: "index",
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || {},
    });
  } catch (error) {
    return next(error);
  }
};


exports.getFavourites = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId).populate("favourites");

    if (!user) {
      return res.redirect("/login");
    }

    const favouriteHomes = await attachGuestRatings(user.favourites.filter(Boolean).map((home) => home.toObject()));

    return res.render("store/favourite-list", {
      favouriteHomes,
      pageTitle: "My Favourites",
      currPage: "favourites",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {},
    });
  } catch (error) {
    return next(error);
  }
};

exports.postAddToFavourite = async (req, res, next) => {
  try {
    const homeId = req.body?.id;
    const userId = req.session?.user?.id;

    if (
      typeof homeId !== "string" ||
      !mongoose.isValidObjectId(homeId)
    ) {
      return res.redirect("/homes");
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.redirect("/login");
    }

    const [user, home] = await Promise.all([
      User.findById(userId),
      Home.findById(homeId),
    ]);

    if (!user) {
      return res.redirect("/login");
    }

    if (!home) {
      return res.redirect("/homes");
    }

    const alreadyFavourite = user.favourites.some(
      (favouriteId) => String(favouriteId) === homeId
    );

    if (!alreadyFavourite) {
      user.favourites.push(home._id);
      await user.save();
    }

    return res.redirect("/favourites");
  } catch (error) {
    return next(error);
  }
};

exports.postDeleteFavourite = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const userId = req.session?.user?.id;

    if (
      typeof homeId !== "string" ||
      !mongoose.isValidObjectId(homeId)
    ) {
      return res.redirect("/favourites");
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    user.favourites = user.favourites.filter(
      (favouriteId) => String(favouriteId) !== homeId
    );

    await user.save();

    return res.redirect("/favourites");
  } catch (error) {
    return next(error);
  }
};



exports.getHomeDetails = async (req, res, next) => {
  try {
    const { homeId } = req.params;

    if (!mongoose.isValidObjectId(homeId)) {
      return res.redirect("/homes");
    }

    const home = await Home.findById(homeId);

    if (!home) {
      return res.redirect("/homes");
    }

    const maxGuests = Number(home.maxGuests);

    const includedGuests =
      home.includedGuests === undefined ||
      home.includedGuests === null
        ? Math.min(2, maxGuests)
        : Number(home.includedGuests);

    // Load actual reviews, with the reviewer's name.
    const reviews = await Review.find({ home: homeId })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate the average from real reviews.
    const ratingSummary = await Review.aggregate([
      {
        $match: {
          home: new mongoose.Types.ObjectId(homeId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating =
      ratingSummary.length > 0
        ? Math.round(ratingSummary[0].averageRating * 10) / 10
        : 0;

    const reviewCount =
      ratingSummary.length > 0
        ? ratingSummary[0].totalReviews
        : 0;

    // Find whether the logged-in guest has a completed,
    // non-cancelled booking that has not already been reviewed.
    let eligibleBooking = null;

    const userId = req.session?.user?.id;

    if (
  userId &&
  mongoose.isValidObjectId(userId) &&
  String(home.host) !== String(userId)
) {
      const now = new Date();

      const reviewedBookingIds = await Review.find({
        home: homeId,
        user: userId,
      }).distinct("booking");

      eligibleBooking = await Booking.findOne({
        home: homeId,
        user: userId,
        status: "confirmed",
        checkOut: { $lte: now },
        _id: { $nin: reviewedBookingIds },
      })
        .sort({ checkOut: -1 })
        .select("_id checkOut")
        .lean();
    }

    return res.render("store/home-detail", {
      home,
      includedGuests,
      reviews,
      averageRating,
      reviewCount,
      eligibleBooking,
      pageTitle: "Home Detail",
      currPage: "Home",
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || {},
      reviewMessage:
  typeof req.query.review === "string"
    ? req.query.review
    : "",
    });
  } catch (error) {
    return next(error);
  }
};