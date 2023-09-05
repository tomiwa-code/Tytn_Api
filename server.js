require("dotenv").config();
require("./utils/passport");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const productRouter = require("./routes/product");
const orderRouter = require("./routes/order");
const announcementRouter = require("./routes/announcement");

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: "GET, POST, DELETE, PUT",
    credentials: true,
  })
);

// Set up session management
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.TYTN_SECRET_KEY],
    maxAge: 72 * 60 * 60 * 1000,
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/announcement", announcementRouter);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running 🚀" });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Start the server
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is listening on port ${process.env.PORT}🚀`);
});
