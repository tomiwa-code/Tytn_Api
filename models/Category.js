// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  img: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Category', CategorySchema);
