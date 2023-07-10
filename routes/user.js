const express = require("express");
const User = require("../models/User");
const {
  verifyToken,
  authenticateUser,
  authenticateAdmin,
} = require("../utils/verifyToken");
const {
  validateUserPassword,
  validateUserDetails,
} = require("../utils/validators");
const createErrorResponse = require("../utils/errorResponse");
const xss = require("xss");
const router = express.Router();
const bcrypt = require("bcrypt");

// verify the token
router.use(verifyToken);

// Get all users
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find();
    // Prepare the user data to send to the frontend (excluding the password)
    const userResults = users.map((user) => {
      const { password, ...others } = user._doc;
      return others;
    });

    // Send the user data to the frontend
    return res.status(200).json(userResults);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get a single user by ID
router.get("/user/:userId", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Update user details route
router.put("/:userId", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, address, addInfo, phone } = req.body;

    // Validate the user details data
    const { errors, valid } = validateUserDetails(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors));
    }

    // Sanitize the req.body
    const userData = {
      name: xss(name),
      additionalInformation: xss(addInfo),
      address: xss(address),
      phone,
      profileCreated: true,
    };

    // Find the user in the database and update
    const user = await User.findOneAndUpdate({ _id: userId }, userData, {
      new: true,
    });
    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }

    res.status(200).json({ message: "updated successfully" });
  } catch (err) {
    return res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Update password route
router.put("/update-password/:userId", authenticateUser, async (req, res) => {
  try {
    // Validate newPassword
    const { errors, valid } = validateUserPassword(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors.password));
    }

    const userId = req.params.userId;
    const { currentPassword, password } = req.body;

    // Find the user in the database and verify the current password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(400)
        .json(createErrorResponse("Invalid current password"));
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password using findByIdAndUpdate
    await User.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
    });

    // Send a success response
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Delete user route
router.delete("/:userId", authenticateUser, async (req, res) => {
  try {
    // Check if the user to be deleted is the same as the authenticated user or an admin
    if (req.user.userId !== req.params.userId && !req.user.isAdmin) {
      return res.status(401).json(createErrorResponse("Unauthorized"));
    }

    // Delete the user from the database
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }

    // Return a success message
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Search for a user
router.get("/search", async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get users statistics route
router.get("/user-stats/", authenticateAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$isAdmin", total: { $sum: 1 } } },
      { $project: { _id: 0, isAdmin: "$_id", total: 1 } },
    ]);

    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Export the router
module.exports = router;
