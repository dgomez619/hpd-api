const mongoose = require('mongoose');

const bookingRequestSchema = new mongoose.Schema({
  // Link to the property being requested
  propertyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  
  // Guest Information
  guestName: { 
    type: String, 
    required: true,
    trim: true 
  },
  contactInfo: { 
    type: String, 
    required: true, 
    trim: true // This will store their Email or WhatsApp number
  },
  
  // Reservation Details
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  guests: { 
    type: Number, 
    required: true,
    default: 1 
  },
  
  // Pricing Reference (Stored at time of request in case prices change later)
  totalPrice: { 
    type: Number 
  },

  // Internal Management
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'denied', 'cancelled'], 
    default: 'pending' 
  },
  adminNotes: { 
    type: String, 
    default: '' 
  },
  
  // Track if the admin has already reached out via WhatsApp
  isContacted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true // This gives you 'createdAt' (useful for the "Inbox" sorting)
});

module.exports = mongoose.model('BookingRequest', bookingRequestSchema);