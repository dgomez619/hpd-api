const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Property = require('../models/Property');
const { parseISO, areIntervalsOverlapping } = require('date-fns');

const sortPropertiesForDisplay = (list) => {
  return [...list].sort((a, b) => {
    const aOrder = typeof a.displayOrder === 'number' ? a.displayOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.displayOrder === 'number' ? b.displayOrder : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};


// @route   GET api/properties
// @desc    Get all properties (Public)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(sortPropertiesForDisplay(properties));
  } catch (err) {
    console.error("Error en GET /:", err.message);
    res.status(500).json({ msg: 'Error del servidor al obtener propiedades' });
  }
});

// @route   PATCH api/properties/reorder
// @desc    Persist manual order for properties
router.patch('/reorder', auth, async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ msg: 'orderedIds debe ser un arreglo no vacío' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index + 1 } }
      }
    }));

    await Property.bulkWrite(bulkOps, { ordered: true });

    const properties = await Property.find();
    res.json(sortPropertiesForDisplay(properties));
  } catch (err) {
    console.error('Error en PATCH /reorder:', err.message);
    res.status(500).json({ msg: 'Error del servidor al reordenar propiedades' });
  }
});

// @route   POST api/properties/:id/availability
// @desc    Advisory availability check; inquiries remain allowed regardless of the result
router.post('/:id/availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'Rango de fechas inválido' });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start < today || end <= start) {
      return res.status(400).json({ msg: 'Rango de fechas inválido' });
    }

    const property = await Property.findById(req.params.id).select('blockedDates');
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

    // Stays use [check-in, check-out), so adjacent stays do not overlap.
    const conflicts = property.blockedDates.filter((block) => {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      return start < blockEnd && end > blockStart;
    });

    res.json({ mayBeUnavailable: conflicts.length > 0 });
  } catch (err) {
    console.error('Error en POST /availability:', err.message);
    res.status(500).json({ msg: 'Error del servidor al consultar disponibilidad' });
  }
});

// @route   GET api/properties/:id
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ msg: 'Propiedad no encontrada' });
    }

// Clean up expired blocks to keep the database light and fast
    // Now 'property' is defined because we just found it in the DB!
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    property.blockedDates = property.blockedDates.filter(block => {
        return new Date(block.endDate) >= today;
    });

    // Save the "cleaned" version back to the database automatically
    await property.save();

    res.json(property);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'ID inválido' });
    res.status(500).send('Error del servidor');
  }
});

// @route   POST api/properties
router.post('/', auth, async (req, res) => {
  const { title_es, title_en, location, description_es, description_en, sqm, pricePerNight, beds, baths, images, amenities, category_es, category_en, externalSyncLinks } = req.body;
  try {
    const lastProperty = await Property.findOne({ displayOrder: { $ne: null } }).sort({ displayOrder: -1 }).select('displayOrder');
    const nextDisplayOrder = lastProperty?.displayOrder ? lastProperty.displayOrder + 1 : 1;

    const newProperty = new Property({
      title_es, title_en, location, description_es, description_en, sqm, pricePerNight, beds, baths, images, amenities, category_es, category_en, externalSyncLinks,
      displayOrder: nextDisplayOrder
    });
    const property = await newProperty.save();
    res.json(property);
  } catch (err) {
    console.error('Error en POST /properties:', err.message);
    res.status(500).json({ msg: 'Error al guardar la propiedad', detail: err.message });
  }
})

// @route   PUT api/properties/:id
router.put('/:id', auth, async (req, res) => {
  try {
    // We use findByIdAndUpdate to handle everything in one go, including new sync links
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!property) return res.status(404).json({ msg: 'Propiedad no encontrada' });
    res.json(property);
  } catch (err) {
    console.error('Error en PUT /properties:', err.message);
    res.status(500).json({ msg: 'Error al actualizar la propiedad', detail: err.message });
  }
});

// @route   POST api/properties/:id/block
// @desc    Add a manual date block
router.post('/:id/block', auth, async (req, res) => {
    try {
        const { startDate, endDate, source } = req.body;
        const property = await Property.findById(req.params.id);

        if (!property) return res.status(404).json({ msg: "Propiedad no encontrada" });

        const newInterval = {
            start: parseISO(startDate),
            end: parseISO(endDate)
        };

        const hasConflict = property.blockedDates.some(existingBlock => {
            const existingInterval = {
                start: new Date(existingBlock.startDate),
                end: new Date(existingBlock.endDate)
            };
            return areIntervalsOverlapping(newInterval, existingInterval, { inclusive: true });
        });

        if (hasConflict) {
            return res.status(400).json({ msg: "Conflicto de fechas: Este periodo ya está ocupado." });
        }

        property.blockedDates.push({
            startDate: newInterval.start,
            endDate: newInterval.end,
            source: source || 'Manual'
        });

        await property.save();
        res.json({ msg: "Bloqueo exitoso", property });
    } catch (err) {
        res.status(500).json({ msg: "Error interno del servidor" });
    }
});

// @route   DELETE api/properties/:id/block/:blockId
// @desc    Remove a specific date block
router.delete('/:id/block/:blockId', auth, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ msg: "Propiedad no encontrada" });
        
        property.blockedDates = property.blockedDates.filter(
            block => block._id.toString() !== req.params.blockId
        );

        await property.save();
        res.json({ msg: "Bloqueo eliminado" });
    } catch (err) {
        res.status(500).json({ msg: "Error al eliminar bloqueo" });
    }
});

// @route   DELETE api/properties/:id
// @desc    Permanently delete a property
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Propiedad no encontrada' });

    await property.deleteOne();
    res.json({ msg: 'Propiedad eliminada permanentemente' });
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'ID no válido' });
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;