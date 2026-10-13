const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Admin = require('../models/Admin');
require('dotenv').config();

// Provide these via environment variables so no real credential is ever
// hardcoded or committed to source control. A random password is generated
// as a fallback and printed once so it can be rotated immediately.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@hospedajepordias.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(18).toString('base64');
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Gerencia Hospedaje PD';

const seedAdmin = async () => {
  try {
    // 1. Connect to your new MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // 2. Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("El administrador ya existe.");
      process.exit();
    }

    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.log(`⚠️  SEED_ADMIN_PASSWORD no fue proporcionada. Se generó una contraseña temporal: ${ADMIN_PASSWORD}`);
      console.log('⚠️  Inicia sesión y cámbiala de inmediato desde el panel de administración.');
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // 4. Create the admin object
    const newAdmin = new Admin({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME
    });

    // 5. Save to Atlas
    await newAdmin.save();
    console.log("✅ Administrador creado exitosamente en la nube.");
    process.exit();

  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();