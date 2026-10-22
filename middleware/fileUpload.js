
const multer = require("multer");
const path = require("path");

// Allowed image types
const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const allowedImageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

// Validate uploaded files
const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  // Property photo
  if (file.fieldname === "photo") {
    const validMimeType =
      allowedImageMimeTypes.includes(file.mimetype);

    const validExtension =
      allowedImageExtensions.includes(extension);

    if (validMimeType && validExtension) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Invalid photo type. Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }

  // House rules PDF
  if (file.fieldname === "houseRules") {
    const validMimeType =
      file.mimetype === "application/pdf";

    const validExtension = extension === ".pdf";

    if (validMimeType && validExtension) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Invalid house rules file. Only PDF files are allowed."
      )
    );
  }

  // Reject unexpected fields
  return cb(new Error("Unexpected file field."));
};

// Keep uploaded files in memory temporarily.
// Cloudinary will store them permanently in the next step.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,

  limits: {
    files: 2,
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
});

module.exports = upload;
