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

      const categoryData = {
        name,
        description,
        img: req.file
          ? cloudinary.uploader
              .upload(req.file.path, {
                public_id: `/${req.file.filename}`,
                folder: "tytn/category_images",
                use_filename: true,
                unique_filename: false,
                crop: "fill",
                width: 500,
                height: 500,
              })
              .then((imageResult) => imageResult.secure_url)
          : null,
      };

      const newCategory = new Category(categoryData);
      const savedCategory = await newCategory.save();

      res.status(201).json(savedCategory);
    } catch (error) {
      res.status(500).json(createErrorResponse(error));
    }
  }
);

//   GET ALL CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ _id: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

//   UPDATE CATEGORY
router.put(
  "/update-category/:categoryId",
  authenticateAdmin,
  upload.single("img"),
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description, img } = req.body;

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