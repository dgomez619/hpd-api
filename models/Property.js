const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  beds: Number,
  baths: Number,
  images: [String],
  amenities: [String],
  iCalUrl: String, // For the future Google Calendar sync
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);