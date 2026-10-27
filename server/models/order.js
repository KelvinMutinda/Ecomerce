const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    // link to the product that was ordered
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

    // copies of the product details at the time of ordering,
    // so the order stays correct even if the product is edited or deleted later
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },

    quantity: { type: Number, required: true, min: 1, max: 20 },
    total: { type: Number, required: true, min: 0 },

    // who ordered and where to deliver
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)