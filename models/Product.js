const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    new_price: {
      type: Number,
    },
    percentageOff: {
      type: Number,
      default: 0,
    },
    orders: {
      type: Number,
      default: 0,
    },
    color: {
      type: [String],
      required: true,
    },
    size: {
      type: [String],
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    categories: {
      type: [String],
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    label_type: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
    },
    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving the document
productSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, remove: /[*+~.()'"!:@]/g });
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
