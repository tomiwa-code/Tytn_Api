const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("invalid image file!", false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
