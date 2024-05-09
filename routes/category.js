const express = require("express");
const Category = require("../models/Category");
const { authenticateAdmin, verifyToken } = require("../utils/verifyToken");
const createErrorResponse = require("../utils/errorResponse");
const cloudinary = require("../utils/cloudinaryConfig");
const upload = require("../utils/multerConfig");

const router = express.Router();

router.use(verifyToken);

// CREATE CATEGORY
router.post(
  "/create-category",
  authenticateAdmin,
  upload.single("img"), // Middleware for handling file uploads
  async (req, res) => {
    try {
      const { name, description } = req.body;

      // Check if the name already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json(createErrorResponse("Category name already exists" ));
      }

      // Upload image to Cloudinary and get the secure URL
      let imageUrl = null;
      if (req.file) {
        const imageResult = await cloudinary.uploader.upload(req.file.path, {
          public_id: `/${req.file.filename}`,
          folder: "tytn/category_images",
          use_filename: true,
          unique_filename: false,
          crop: "fill",
          width: 500,
          height: 500,
        });
        imageUrl = imageResult.secure_url;
      }

      // Create new Category object with secure image URL
      const newCategory = new Category({
        name,
        description,
        img: imageUrl,
      });

      // Save the new category to the database
      const savedCategory = await newCategory.save();

      res.status(201).json(savedCategory);
    } catch (error) {
      res.status(500).json(createErrorResponse(error));
    }
  }
);

// GET ALL CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ _id: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// UPDATE CATEGORY
router.put(
  "/update-category/:categoryId",
  authenticateAdmin,
  upload.single("img"),
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description, img } = req.body;

      // Check if the new category name already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory && existingCategory._id.toString() !== categoryId) {
        return res.status(400).json(createErrorResponse("Category name already exists"));
      }

      const categoryData = {
        name,
        description,
        ...(img && {
          img: cloudinary.uploader
            .upload(img.path, {
              public_id: `/${img.filename}`,
              folder: "tytn/category_images",
              use_filename: true,
              unique_filename: false,
              crop: "fill",
              width: 500,
              height: 500,
            })
            .then((imageResult) => imageResult.secure_url),
        }),
      };

      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        categoryData,
        { new: true }
      );

      if (!updatedCategory) {
        return res.status(404).json(createErrorResponse("Category not found"));
      }

      res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json(createErrorResponse("An error occurred"));
    }
  }
);


// DELETE CATEGORY
router.delete("/:categoryId", authenticateAdmin, async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(
      req.params.categoryId
    );

    if (!deletedCategory) {
      return res.status(404).json(createErrorResponse("Category not found"));
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

module.exports = router;
