const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const  requireLogin  = require("../middleware/auth");

// Submit a review for a completed booking.
router.post(
  "/homes/:homeId/reviews",
  requireLogin,
  reviewController.postReview
);

module.exports = router;