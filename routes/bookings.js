const express = require('express');
const router = express.Router();
const BookingRequest = require('../models/BookingRequest');
const auth = require('../middleware/auth'); // Your admin auth middleware

// @route   POST api/bookings
// @desc    Guest creates a new booking request
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { 
      propertyId, 
      guestName, 
      contactInfo, 
      startDate, 
      endDate, 
      guests, 
      totalPrice 
    } = req.body;

    const newRequest = new BookingRequest({
      propertyId,
      guestName,
      contactInfo,
      startDate,
      endDate,
      guests,
      totalPrice
    });

    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al procesar la solicitud de reserva');
  }
});

// @route   GET api/bookings
// @desc    Admin gets all requests for the Inbox
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // .populate('propertyId', 'title_es title_en images') 
    // This pulls property details automatically so the Inbox looks great!
    const requests = await BookingRequest.find()
      .populate('propertyId', 'title_es title_en images')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor al obtener mensajes');
  }
});

// @route   PATCH api/bookings/:id
// @desc    Admin updates status (Approve/Deny)
// @access  Private (Admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updatedRequest = await BookingRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status, adminNotes } },
      { new: true }
    );
    res.json(updatedRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al actualizar el estado');
  }
});

module.exports = router;