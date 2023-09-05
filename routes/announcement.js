const express = require("express");
const Announcement = require("../models/Announcement");
const { authenticateAdmin, verifyToken } = require("../utils/verifyToken");
const createErrorResponse = require("../utils/errorResponse");
const upload = require("../utils/multerConfig");
const cloudinary = require("../utils/cloudinaryConfig");
const { validateAnnouncement } = require("../utils/validators");
const router = express.Router();

router.use(verifyToken);

// Create a new announcement
router.post(
  "/create-announcement",
  authenticateAdmin,
  upload.single("img"),
  async (req, res) => {
    try {
      const { title, subtitle, text } = req.body;

      // Check if the image is uploaded
      if (!req.file) {
        return res.status(400).json(createErrorResponse("Image is required"));
      }

      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: `/${req.file.filename}`,
        folder: "tytn/announcements",
        use_filename: true,
        unique_filename: false,
      });

      // Create the new announcement
      const newAnnouncement = new Announcement({
        title,
        subtitle,
        text,
        img: result.secure_url, // Save the image URL from Cloudinary in the announcement data
      });

      // Save the announcement to the database
      const savedAnnouncement = await newAnnouncement.save();

      res.status(201).json(savedAnnouncement);
    } catch (error) {
      res.status(500).json(createErrorResponse("An error occurred"));
    }
  }
);

// Get all announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get a specific announcement
router.get("/:announcementId", async (req, res) => {
  try {
    const announcement = await Announcement.findById(
      req.params.announcementId
    ).exec();

    if (!announcement) {
      return res
        .status(404)
        .json(createErrorResponse("Announcement not found"));
    }

    res.status(200).json(announcement);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Update an announcement
router.put(
  "/:announcementId",
  authenticateAdmin,
  upload.single("img"),
  async (req, res) => {
    try {
      const { errors, valid } = validateAnnouncement(req.body);
      if (!valid) {
        return res.status(400).json(createErrorResponse(errors.message));
      }

      const { title, subtitle, text } = req.body;
      let img = req.body.img;

      // Find the announcement by ID
      const announcement = await Announcement.findById(
        req.params.announcementId
      );

      if (!announcement) {
        return res
          .status(404)
          .json(createErrorResponse("Announcement not found"));
      }

      // If a new image is uploaded, upload it to Cloudinary and get the image URL
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          public_id: `/${req.file.filename}`,
          folder: "tytn/announcements",
          use_filename: true,
          unique_filename: false,
        });

        // Save the image URL in the announcement data
        img = result.secure_url;
      }

      // Update the announcement data
      announcement.title = title;
      announcement.subtitle = subtitle;
      announcement.text = text;
      announcement.img = img;

      // Save the updated announcement to the database
      const updatedAnnouncement = await announcement.save();

      res.status(200).json(updatedAnnouncement);
    } catch (error) {
      console.log(error);
      res.status(500).json(createErrorResponse("An error occurred"));
    }
  }
);

// Delete an announcement
router.delete("/:announcementId", authenticateAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(
      req.params.announcementId
    );

    if (!announcement) {
      return res
        .status(404)
        .json(createErrorResponse("Announcement not found"));
    }

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

module.exports = router;
