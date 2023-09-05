const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const {
  validateAuthData,
  validateUserEmail,
  validateUserPassword,
} = require("../utils/validators");
const { generateToken, generateResetToken } = require("../utils/token");
const createErrorResponse = require("../utils/errorResponse");
const xss = require("xss");
const jwt = require("jsonwebtoken");
const router = express.Router();
const passport = require("passport");

// Google auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?success=false&eae=true`, // Redirect to the login page on failure
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?token=${req.user.token}`);
  }
);

// Signup route
router.post("/signup", async (req, res) => {
  try {
    // Validate user signup data
    const { errors, valid } = validateAuthData(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors));
    }

    // extract username and password from body and sanitize
    const reqEmail = xss(req.body.email);
    const sanitizePassword = xss(req.body.password);

    // Check if user already exists
    const existingUser = await User.findOne({ reqEmail });
    if (existingUser) {
      return res
        .status(400)
        .json(createErrorResponse("Email is already registered"));
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sanitizePassword, salt);

    // Create a new user
    const newUser = new User({
      email: reqEmail,
      password: hashedPassword,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Generate an access token
    const token = generateToken(savedUser);

    // Prepare the user data to send to the frontend
    const { email, _id } = savedUser;

    // Send the user data and token to the frontend
    res.status(200).json({ token, user: { email, _id } });
  } catch (error) {
    res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// User sign-in route
router.post("/signin", async (req, res) => {
  try {
    // Validate the signin data
    const { errors, valid } = validateAuthData(req.body);
    if (!valid) {
      return res.status(400).json(errors);
    }

    // extract username and password from body and sanitize
    const reqEmail = xss(req.body.email);
    const sanitizePassword = xss(req.body.password);

    // Check if the user exists
    const user = await User.findOne({ reqEmail });
    if (!user) {
      return res
        .status(400)
        .json(createErrorResponse("Email or Password is Incorrect"));
    }

    // Compare the provided password with the stored password
    const validPassword = bcrypt.compare(sanitizePassword, user.password);
    if (!validPassword) {
      return res
        .status(400)
        .json(createErrorResponse("Email or Password is Incorrect"));
    }

    // Generate the token
    const token = generateToken(user);

    // Prepare the user data to send to the frontend (excluding the password)
    const { email, _id } = user;

    // Send the token and user data to the frontend
    return res.status(200).json({
      token,
      user: { email, _id },
    });
  } catch (err) {
    return res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Forgot Password route
router.post("/forgot-password", async (req, res) => {
  try {
    // Validate the user email
    const { errors, valid } = validateUserEmail(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors));
    }

    // extract username and password from body and sanitize
    const email = xss(req.body.email);

    // Find the user by email
    const user = await User.findOne({ email });

    // If the user does not exist, return an error
    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }

    const payload = {
      userId: user._id,
      email: user.email,
    };

    // Create a secret to allow link to be used just once
    const secret = process.env.JWT_SECRET + user.password;

    // Generate a unique token that expires in 15m
    const uniqueToken = generateResetToken(payload, secret);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_MAIL,
        pass: process.env.MY_MAIL_PASS,
      },
    });

    // Create the reset password link with the generated token
    const resetPasswordLink = `${process.env.CLIENT_URL}/reset-password/${user._id}/${uniqueToken}`;

    // Compose the email
    const mailOptions = {
      from: "tytnfits@gmail.com",
      to: email,
      subject: "Password Reset",
      html: `
      <p>Hello,</p>
      <p>You have requested to reset your password. Please click the link below to proceed:</p>
      <a href="${resetPasswordLink}">${resetPasswordLink}</a>
      <p>Note: This link is valid for 15 minutes only.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Regards,</p>
      <p>TYTN's Team</p>
    `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res
          .status(500)
          .json(createErrorResponse("Failed to send reset password email"));
      } else {
        res.status(200).json({ message: `Reset password email sent` });
      }
    });
  } catch (error) {
    res.status(500).json(createErrorResponse("Failed to reset password"));
  }
});

//  Reset Password route
router.post("/reset-password/:userId/:token", async (req, res) => {
  try {
    const { userId, token } = req.params;

    // Validate the new password
    const { errors, valid } = validateUserPassword(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors));
    }

    const newPassword = xss(req.body.password);

    // Find the user by ID
    const user = await User.findById(userId);

    // If the user does not exist, return an error
    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }

    // Verify the reset token
    const secret = process.env.JWT_SECRET + user.password;
    const decodedToken = jwt.verify(token, secret);

    // If the token is invalid or expired, return an error
    if (!decodedToken) {
      return res
        .status(400)
        .json(createErrorResponse("Invalid or expired token"));
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json(createErrorResponse(error.message));
  }
});

module.exports = router;
