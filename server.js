const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const syncRoutes = require('./routes/sync');
const bookingRoutes = require('./routes/bookings'); // 1. IMPORT the new booking routes
const serviceRoutes = require('./routes/services');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://hpdvnz.netlify.app'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/sync', syncRoutes);
app.use('/api/export', require('./routes/exports'));
app.use('/api/bookings', bookingRoutes); // 2. REGISTER the bookings route
app.use('/api/services', serviceRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Error interno del servidor' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, 
})
.then(() => console.log('Conexión a MongoDB exitosa'))
.catch(err => {
  console.error('Error de conexión:', err.message);
});

// Basic Route for Testing
app.get('/', (req, res) => {
  res.send('Servidor de Hospedaje por Dias está en línea.');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));