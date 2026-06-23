const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const ServiceInquiry = require('../models/ServiceInquiry');
const auth = require('../middleware/auth'); // Admin protection

// --- PUBLIC ROUTES ---

// 1. Get all active services for the frontend
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching services' });
  }
});

// 2. Submit a new service inquiry
router.post('/inquire', async (req, res) => {
  try {
    const newInquiry = new ServiceInquiry(req.body);
    const saved = await newInquiry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ msg: 'Error sending inquiry' });
  }
});

// --- ADMIN ROUTES ---

// 3. Create a new service (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ msg: 'Error creating service' });
  }
});

// 4. Get all inquiries for the Admin Inbox
router.get('/inquiries', auth, async (req, res) => {
  try {
    const inquiries = await ServiceInquiry.find()
      .populate('serviceId', 'title_es title_en')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching inquiries' });
  }
});

// 5. Toggle Service Status (Admin only)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: 'Servicio no encontrado' });

    service.isActive = !service.isActive;
    await service.save();

    res.json(service);
  } catch (err) {
    res.status(500).json({ msg: 'Error al cambiar el estado' });
  }
});

module.exports = router;