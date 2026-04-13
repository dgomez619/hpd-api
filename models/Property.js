const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // LOCALIZED TITLES
  title_es: { type: String, required: true },
  title_en: { type: String, required: true },

  location: { type: String, required: true },

  // LOCALIZED DESCRIPTIONS
  description_es: { type: String, required: true },
  description_en: { type: String, required: true },

  // MEASUREMENTS (Stored in Square Meters m²)
  sqm: { type: Number, required: true }, 

  pricePerNight: { type: Number, required: true },
  beds: Number,
  baths: Number,
  images: [String],

  // AMENITIES (Stored as IDs for the Tag System)
  // Example: ['wifi', 'pool', 'ac']
  amenities: [String],

  // LOCALIZED CATEGORY (BADGE)
  category_es: { type: String, default: 'Apartamento' },
  category_en: { type: String, default: 'Apartment' },
  
  externalSyncLinks: [/* ... existing logic ... */],
  blockedDates: [/* ... existing logic ... */],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// VIRTUAL: Generate the Export URL on the fly (No need to store it)
// This is the link you give to Airbnb.
propertySchema.virtual('exportUrl').get(function() {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  return `${baseUrl}/api/export/${this._id}.ics`;
});

// Ensure virtuals are included when converting to JSON
propertySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Property', propertySchema);