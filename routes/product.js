const express = require("express");
const Product = require("../models/Product");
const {
  authenticateAdmin,
  verifyToken,
  authenticateUser,
} = require("../utils/verifyToken");
const createErrorResponse = require("../utils/errorResponse");
const { validateProduct } = require("../utils/validators");
const slugify = require("slugify");
const cloudinary = require("../utils/cloudinaryConfig");
const upload = require("../utils/multerConfig");

const router = express.Router();

router.use(verifyToken);

// Create a new product
router.post(
  "/create-product",
  authenticateAdmin,
  upload.single("img"),
  async (req, res) => {
    try {
      // Validate the product details
      const { errors, valid } = validateProduct(req.body);
      if (!valid) {
        return res.status(400).json(createErrorResponse(errors.message));
      }

      const productData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price, 
        new_price: req.body.new_price, 
        color: req.body.color,
        size: req.body.size,
        categories: req.body.categories,
        percentageOff: req.body.percentageOff,
        label_type: req.body.label_type,
        inStock: req.body.inStock,
      };

      // Check if the title already exists
      const existingProduct = await Product.findOne({ title: req.body.title });
      if (existingProduct) {
        return res.status(400).json({ error: "Title already exists" });
      }

      // Upload the image to Cloudinary
      if (!req.file) {
        return res.status(400).json({ error: "upload a valid image" });
      }

      const imageResult = await cloudinary.uploader.upload(req.file.path, {
        public_id: `/${req.file.filename}`,
        folder: "tytn/product_images",
        use_filename: true,
        unique_filename: false,
        crop: "fill",
        width: 500,
        height: 500,
      });

      // Save the image URL in the productData
      productData.img = imageResult.secure_url;

      // Create the new product
      const newProduct = new Product(productData);

      // Save the product to the database
      const savedProduct = await newProduct.save();

      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).json(createErrorResponse(error));
    }
  }
);

// Get all products with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number, default is 1
    const limit = parseInt(req.query.limit) || 10; // Number of products per page, default is 15

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const totalProducts = await Product.countDocuments();

    const products = await Product.find()
      .sort({ _id: -1 })
      .skip(startIndex)
      .limit(limit);

    // Create pagination metadata
    const pagination = {};
    if (endIndex < totalProducts) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    res.status(200).json({ products, pagination });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get products base on type
router.get("/product-type", async (req, res) => {
  try {
    let query = {}; // Query object for filtering products

    if (req.query.trend) {
      query.type = "trend";
      console.log("tf");
    } else if (req.query.newProduct) {
      console.log("tfs");
      query.type = "newProduct";
    }

    const products = await Product.find(query).sort({ _id: -1 }).limit(3);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get a specific product
router.get("/product/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json(createErrorResponse("Product not found"));
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Search for a product
router.get("/search", async (req, res) => {
  const { query } = req.query;

  try {
    const products = await Product.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { categories: { $regex: query, $options: "i" } },
      ],
    }).sort({ _id: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Update a product
router.put(
  "/update-product/:productId",
  authenticateAdmin,
  upload.single("img"),
  async (req, res) => {
    // Validate the product data
    const { errors, valid } = validateProduct(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors.message));
    }

    try {
      const slug = slugify(req.body.title, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
      });

      const productData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        color: req.body.color,
        size: req.body.size,
        categories: req.body.categories,
        percentageOff: req.body.percentageOff,
        type: req.body.type,
        inStock: req.body.inStock,
        slug,
      };

      // Check if the title already exists
      const existingProduct = await Product.findOne({ title: req.body.title });
      if (existingProduct) {
        return res.status(400).json({ error: "Title already exists" });
      }

      // Upload the image to Cloudinary
      if (req.file) {
        const imageResult = await cloudinary.uploader.upload(req.file.path, {
          public_id: `/${req.file.filename}`,
          folder: "tytn/product_images",
          use_filename: true,
          unique_filename: false,
          crop: "fill",
          width: 500,
          height: 500,
        });
        // Save the image URL in the productData
        productData.img = imageResult.secure_url;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.productId,
        productData,
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json(createErrorResponse("Product not found"));
      }

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.log(error);
      res.status(500).json(createErrorResponse("An error occurred"));
    }
  }
);

// Delete a product
router.delete("/:productId", authenticateAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(
      req.params.productId
    );

    if (!deletedProduct) {
      return res.status(404).json(createErrorResponse("Product not found"));
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Like or unlike a product
router.post("/like/:productId", authenticateUser, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId;

  try {
    const product = await Product.findById(productId);

    // Check if the user has already liked the product
    const isLiked = product.likedBy.includes(userId);

    if (isLiked) {
      // User has already liked the product, unlike it
      await Product.findByIdAndUpdate(productId, {
        $pull: { likedBy: userId },
      });
      res.status(200).json({ message: "Product unliked" });
    } else {
      // User hasn't liked the product, like it
      product.likedBy.push(userId);
      await product.save();
      res.status(200).json({ message: "Product liked" });
    }
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get all products liked by a user
router.get("/liked", authenticateUser, async (req, res) => {
  const userId = req.user.userId;

  try {
    const products = await Product.find({ likedBy: userId });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(createErrorResponse("Something went wrong"));
  }
});

// Track product view
router.post("/view/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    // Get the product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json(createErrorResponse("Product not found"));
    }

    // Increment the view count
    product.views += 1;
    await product.save();

    res.status(200).json({ message: "Product view tracked successfully" });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get all product stats
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    // Retrieve all products
    const products = await Product.find();

    // Calculate total number of products
    const totalProducts = products.length;

    // Calculate total views, likes, and dislikes for each product
    const productStats = products.map((product) => {
      return {
        productId: product._id,
        views: product.views,
        likes: product.likedBy.length,
      };
    });

    res.status(200).json({ totalProducts, productStats });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

module.exports = router;
