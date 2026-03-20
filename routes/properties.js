const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Property = require('../models/Property');

// --- ADD THIS ROUTE HERE (Get All) ---
// @route   GET api/properties
// @desc    Get all properties (Public)
router.get('/', async (req, res) => {
  try {
    // This fetches every house in your DB and sorts by newest first
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error("Error en GET /:", err.message);
    res.status(500).json({ msg: 'Error del servidor al obtener propiedades' });
  }
});

// --- KEEP THIS ONE BELOW (Get Single) ---
// @route   GET api/properties/:id
// @desc    Get a single property by its ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }
    res.json(property);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'ID inválido' });
    res.status(500).send('Error del servidor');
  }
});

// @route   POST api/properties
// @desc    Add new property (Private - Admin only)
router.post('/', auth, async (req, res) => {
  const { title, location, description, pricePerNight, beds, baths, images, amenities } = req.body;

  try {
    const newProperty = new Property({
      title,
      location,
      description,
      pricePerNight,
      beds,
      baths,
      images,
      amenities
    });

    const property = await newProperty.save();
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al guardar la propiedad');
  }
});

// @route   DELETE api/properties/:id
// @desc    Delete a property (Private - Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    await property.deleteOne();
    res.json({ msg: 'Propiedad eliminada correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al eliminar la propiedad');
  }
});

// @route   DELETE api/properties/:id
// @desc    Permanently delete a property
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    // Perform the deletion
    await property.deleteOne();
    
    res.json({ msg: 'Propiedad eliminada permanentemente' });
  } catch (err) {
    console.error(err.message);
    // If the ID is formatted incorrectly, MongoDB throws an error
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de propiedad no válido' });
    }
    res.status(500).send('Error del servidor al eliminar');
  }
});

// @route   PUT api/properties/:id
// @desc    Update an existing property
router.put('/:id', auth, async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    // Update the property with the data sent in the request body
    property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } // This returns the updated version of the document
    );

    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al actualizar la propiedad');
  }
});

module.exports = router;