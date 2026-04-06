const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
// REPLACING 'description' with localized versions
  description_es: { type: String, required: true },
  description_en: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  beds: Number,
  baths: Number,
  images: [String],
  amenities: [String],
  category: {type: String, default: 'Apartamento'}, // NEW: Property category (e.g., Apartment, House, etc.)
  
  // NEW: Support for multiple external calendars (Airbnb, Booking, etc.)
  externalSyncLinks: [
    {
      platform: { type: String, required: true }, // e.g., 'Airbnb'
      url: { type: String, required: true },      // The .ics link they give you
      lastSynced: { type: Date, default: Date.now }
    }
  ],

  // NEW: Manual date blocking (for maintenance or owner use)
  // Format: ['2026-05-10', '2026-05-11']
// Inside your Property Schema
blockedDates: [
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    source: { 
      type: String, 
      enum: ['Airbnb', 'Booking.com', 'Booking', 'Manual', 'Direct-Booking'], 
      default: 'Manual' 
    },
    externalId: String, // To store the UID from the Airbnb/Booking .ics file
    lastSynced: { type: Date, default: Date.now }
  }
],
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