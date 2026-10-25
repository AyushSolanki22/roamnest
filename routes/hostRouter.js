
const express = require("express");
const hostRouter = express.Router();

const upload = require("../middleware/fileUpload");
const requireLogin = require("../middleware/auth");
const requireHost = require("../middleware/requireHost");
const hostController = require("../controllers/hostController");

// All host routes require authentication and host authorization.
hostRouter.use(requireLogin);
hostRouter.use(requireHost);

// Display add-home page
hostRouter.get(
  "/add-home",
  hostController.getAddHome
);

// Add home with image and house-rules PDF
hostRouter.post(
  "/add-home",
  upload.fields([
    {
      name: "photo",
      maxCount: 1
    },
    {
      name: "houseRules",
      maxCount: 1
    }
  ]),
  hostController.postAddHome
);

// Host booking overview (only bookings for the signed-in host's properties).
hostRouter.get("/bookings", hostController.getHostBookings);

// Display host homes
hostRouter.get(
  "/host-homes",
  hostController.getHostHomes
);

// Display edit page
hostRouter.get(
  "/edit-home/:homeId",
  hostController.getEditHome
);

// Update home with optional new image or house-rules PDF
hostRouter.post(
  "/edit-home/:homeId",
  upload.fields([
    {
      name: "photo",
      maxCount: 1
    },
    {
      name: "houseRules",
      maxCount: 1
    }
  ]),
  hostController.postEditHome
);

// Delete home
hostRouter.post(
  "/delete-home/:homeId",
  hostController.postDeleteHome
);

// Review early-checkout requests
hostRouter.get(
  "/early-checkout-requests",
  hostController.getEarlyCheckoutRequests
);

// Approve early checkout and set the refund amount
hostRouter.post(
  "/early-checkout-requests/:bookingId/approve",
  hostController.postApproveEarlyCheckout
);

// Reject early checkout
hostRouter.post(
  "/early-checkout-requests/:bookingId/reject",
  hostController.postRejectEarlyCheckout
);

module.exports = hostRouter;
