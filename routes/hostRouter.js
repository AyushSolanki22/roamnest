const express = require("express");
const hostRouter = express.Router();

const upload = require("../middleware/fileUpload");
const requireLogin = require("../middleware/auth");
const hostController = require("../controllers/hostController");

console.log("requireLogin:", typeof requireLogin);
console.log("getAddHome:", typeof hostController.getAddHome);
console.log("postAddHome:", typeof hostController.postAddHome);
console.log("getHostHomes:", typeof hostController.getHostHomes);
console.log("getEditHome:", typeof hostController.getEditHome);
console.log("postEditHome:", typeof hostController.postEditHome);
console.log("postDeleteHome:", typeof hostController.postDeleteHome);
console.log("upload.fields:", typeof upload.fields);


// Display add-home page
hostRouter.get(
  "/add-home",
  requireLogin,
  hostController.getAddHome
);

// Add home with image
hostRouter.post(
  "/add-home",
  requireLogin,
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

// Display host homes
hostRouter.get(
  "/host-homes",
  requireLogin,
  hostController.getHostHomes
);

// Display edit page
hostRouter.get(
  "/edit-home/:homeId",
  requireLogin,
  hostController.getEditHome
);

// Update home with optional new image
hostRouter.post(
  "/edit-home/:homeId",
  requireLogin,
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
  requireLogin,
  hostController.postDeleteHome
);

exports.hostRouter = hostRouter;