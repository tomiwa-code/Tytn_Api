const mongoose = require("mongoose");
const slugify = require("slugify");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      unique: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving the document
faqSchema.pre("save", function (next) {
  if (this.isModified("question")) {
    this.slug = slugify(this.question, { lower: true });
  }
  next();
});

const FAQ = mongoose.model("FAQ", faqSchema);

module.exports = FAQ;
