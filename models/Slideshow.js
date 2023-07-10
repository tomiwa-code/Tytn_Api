const mongoose = require("mongoose");

const slideshowSchema = new mongoose.Schema(
  {
    images: [
      {
        url: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Slideshow = mongoose.model("Slideshow", slideshowSchema);

module.exports = Slideshow;
