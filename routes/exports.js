const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const ical = require('ical-generator').default;

// GET /api/export/:id.ics
router.get('/:id.ics', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).send('Property not found');
    }

    // Initialize the Calendar Object
    const calendar = ical({
      name: `HospedajePD - ${property.title}`,
      prodId: { company: 'HospedajePD', product: 'Property-Management-System' },
    });

    // 1. ADD BLOCKED DATES TO THE iCAL
    // We loop through your 'blockedDates' array (Manual, Airbnb, Booking, etc.)
    property.blockedDates.forEach(block => {
      calendar.createEvent({
        start: new Date(block.startDate),
        end: new Date(block.endDate),
        summary: block.source === 'Manual' ? 'Bloqueo Manual' : `Reservado (${block.source})`,
        description: `Bloqueo sincronizado desde HospedajePD - ${block.source}`,
        // We use the block's _id or externalId as a unique identifier for Airbnb
        uid: block.externalId || block._id.toString(), 
      });
    });

    // 2. SET HEADERS (Crucial for external platforms to recognize it as a file)
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${property._id}.ics"`,
    });

    // 3. SEND THE CALENDAR STRING
    return res.send(calendar.toString());

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;