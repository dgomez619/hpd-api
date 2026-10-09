const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const ServiceInquiry = require('../models/ServiceInquiry');
const auth = require('../middleware/auth'); // Admin protection
const { publicFormLimiter, honeypotGuard, turnstileGuard } = require('../middleware/antiBot');

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
router.post('/inquire', publicFormLimiter, honeypotGuard, turnstileGuard, async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.body.serviceId,
      isActive: true,
      isAvailable: { $ne: false }
    });
    if (!service) {
      return res.status(409).json({ msg: 'El servicio no está disponible actualmente' });
    }

    const newInquiry = new ServiceInquiry(req.body);
    const saved = await newInquiry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ msg: 'Error sending inquiry' });
  }
});

// --- ADMIN ROUTES ---

// 3. Get every service for the management dashboard, including paused ones.
router.get('/admin', auth, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching services' });
  }
});

// 4. Create a new service (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ msg: 'Error creating service' });
  }
});

// 5. Update a service (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const allowedFields = [
      'title_en',
      'title_es',
      'description_en',
      'description_es',
      'category',
      'image',
      'priceInfo',
      'isActive',
      'isAvailable'
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const service = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!service) return res.status(404).json({ msg: 'Servicio no encontrado' });

    res.json(service);
  } catch (err) {
    res.status(400).json({ msg: 'Error updating service' });
  }
});

// 6. Get all inquiries for the Admin Inbox
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

// 7. Toggle Service publication status (Admin only)
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

// 8. Toggle whether a published service accepts new inquiries (Admin only)
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: 'Servicio no encontrado' });

    service.isAvailable = !service.isAvailable;
    await service.save();

    res.json(service);
  } catch (err) {
    res.status(500).json({ msg: 'Error al cambiar la disponibilidad' });
  }
});

module.exports = router;