// config/multer.js
const multer = require("multer");
const { storage } = require("./cloudinary"); // from config/cloudinary.js

const upload = multer({ storage });

module.exports = upload;
