const express = require("express");
const Order = require("../models/Order");
const {
  authenticateUser,
  verifyToken,
  authenticateAdmin,
} = require("../utils/verifyToken");
const createErrorResponse = require("../utils/errorResponse");
const { validateOrders } = require("../utils/validators");
const User = require("../models/User");
const router = express.Router();

router.use(verifyToken);

// Create a new order
router.post("/", authenticateUser, async (req, res) => {
  try {
    // Validate if required fields are provided
    const { errors, valid } = validateOrders(req.body);
    if (!valid) {
      return res.status(400).json(createErrorResponse(errors.message));
    }

    const {
      products,
      totalPrice,
      shippingAddress,
      transactionId,
      paymentMethod,
    } = req.body;

    // Create the new order
    const newOrder = new Order({
      user: req.user.userId,
      products,
      totalPrice,
      shippingAddress,
      transactionId,
      paymentMethod,
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get all orders (for admin)
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate({
      path: "products.product",
      select: "title price img",
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get all orders made by the user
router.get("/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.find({ user: userId }).populate({
      path: "products.product",
      select: "title price img",
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get a single order by ID
router.get("/:orderId", authenticateUser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse("Order not found"));
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Update an order's status
router.put("/:orderId/status", authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json(createErrorResponse("Missing status field"));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json(createErrorResponse("Order not found"));
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Delete an order
router.delete("/:orderId", authenticateAdmin, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.orderId);
    if (!deletedOrder) {
      return res.status(404).json(createErrorResponse("Order not found"));
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Get user details by order ID
router.get("/user/:orderId", authenticateAdmin, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order by ID and populate the product field with limited details
    const order = await Order.findById(orderId).populate({
      path: "products.product",
      select: "title price",
    });

    if (!order) {
      return res.status(404).json(createErrorResponse("Order not found"));
    }

    // Get the user details by user ID from the order
    const user = await User.findById(order.user);

    if (!user) {
      return res.status(404).json(createErrorResponse("User not found"));
    }

    res.status(200).json({ user, products: order.products });
  } catch (error) {
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

// Route to get order stats for different months
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const stats = await getOrderStats();
    res.status(200).json(stats);
  } catch (error) {
    console.log(error)
    res.status(500).json(createErrorResponse("An error occurred"));
  }
});

module.exports = router;
