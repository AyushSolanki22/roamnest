
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload a file buffer to Cloudinary
const uploadBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// Upload property photos
const uploadImage = (file) => {
  return uploadBuffer(file.buffer, {
    folder: "stayora/homes",
    resource_type: "image",
  });
};

// Upload house-rules PDFs
const uploadHouseRules = (file) => {
  const safeName = path
    .parse(file.originalname)
    .name
    .replace(/[^a-zA-Z0-9_-]/g, "-");

  return uploadBuffer(file.buffer, {
    folder: "stayora/house-rules",
    resource_type: "image",
    public_id: `${Date.now()}-${safeName}`,
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadHouseRules,
};
