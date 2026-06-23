const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title_en: { type: String, required: true },
  title_es: { type: String, required: true },
  // Made these optional for now to troubleshoot the 400 error
  description_en: { type: String }, 
  description_es: { type: String },
  // Removed the enum restriction—we can re-add it once we verify the data flow
  category: { type: String, required: true }, 
  image: { type: String, required: true }, 
  priceInfo: { type: String }, 
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);