
const express = require("express");
const storeRouter = express.Router();

const storeController = require("../controllers/storeController");
const requireLogin = require("../middleware/auth");

storeRouter.get("/", storeController.getIndex);
storeRouter.get("/homes", storeController.getHomes);

// Favourites require an authenticated user.
storeRouter.get(
  "/favourites",
  requireLogin,
  storeController.getFavourites
);

storeRouter.get("/homes/:homeId", storeController.getHomeDetails);

storeRouter.post(
  "/favourites",
  requireLogin,
  storeController.postAddToFavourite
);

storeRouter.post(
  "/delete-favourite/:homeId",
  requireLogin,
  storeController.postDeleteFavourite
);

module.exports = storeRouter;
