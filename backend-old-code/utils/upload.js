// utils/upload.js
const cloudinary = require("cloudinary").v2; // ✅ .v2 is important
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// ✅ Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Pass cloudinary object correctly
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // ✅ must be passed explicitly
  params: {
    folder: "metacow-profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });
module.exports = upload;
