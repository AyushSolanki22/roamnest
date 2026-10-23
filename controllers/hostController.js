const Home = require("../models/home");
const mongoose = require("mongoose");

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
