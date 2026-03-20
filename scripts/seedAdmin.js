const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // 1. Connect to your new MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // 2. Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@hospedajepordias.com' });
    if (existingAdmin) {
      console.log("El administrador ya existe.");
      process.exit();
    }

    // 3. Hash your secret password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('H0593d@J3**', salt); // Change this!

    // 4. Create the admin object
    const newAdmin = new Admin({
      email: 'admin@hospedajepordias.com',
      password: hashedPassword,
      name: 'Gerencia Hospedaje PD'
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