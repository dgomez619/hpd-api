const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// LOGIN ROUTE: POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // 2. Compare password with the Hash in Atlas
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // 3. Create the Passport (JWT)
    const token = jwt.sign(
      { id: admin._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } // Log out automatically after 8 hours
    );

    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;