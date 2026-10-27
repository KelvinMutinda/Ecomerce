const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true, trim: true },   // saved path, e.g. /uploads/ab12cd.jpg
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: ['men', 'women', 'kids'],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)