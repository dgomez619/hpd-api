const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { syncExternalCalendars } = require('../services/syncService');

// POST /api/sync/all
// This will wake up the server and refresh every property
router.post('/all', async (req, res) => {
  try {
    const properties = await Property.find({ isActive: true });
    
    const syncPromises = properties.map(p => syncExternalCalendars(p._id));
    await Promise.all(syncPromises);

    res.json({ msg: "Sincronización completada con éxito" });
  } catch (error) {
    res.status(500).json({ msg: "Error en la sincronización global" });
  }
});

module.exports = router;