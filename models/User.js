const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
    },
    additionalInformation: {
      type: String,
    },
    phone: {
      type: [String],
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profileCreated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
