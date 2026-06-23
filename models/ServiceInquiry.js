const mongoose = require('mongoose');

const serviceInquirySchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },
  guestName: { type: String, required: true },
  contactInfo: { type: String, required: true },
  propertyName: { type: String, required: true }, // Verification field
  stayDates: { type: String, required: true },   // Verification field
  message: { type: String },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'completed', 'cancelled'], 
    default: 'new' 
  }
}, { timestamps: true });

module.exports = mongoose.model('ServiceInquiry', serviceInquirySchema);