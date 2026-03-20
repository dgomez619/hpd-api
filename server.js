const express = require('express');

const mongoose = require('mongoose');

const cors = require('cors');

require('dotenv').config();



const app = express();



// Middleware

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // ADD x-auth-token HERE
  credentials: true
}));



app.use(express.json()); // Allows us to read JSON sent from React



// Routes

app.use('/api/auth', require('./routes/auth'));

// Add this in server.js
app.use('/api/properties', require('./routes/properties'));



// Connect to MongoDB

mongoose.connect(process.env.MONGODB_URI)

.then(() => console.log('Conexión a MongoDB exitosa'))

.catch(err => console.error('Error de conexión:', err));



// Basic Route for Testing

app.get('/', (req, res) => {

res.send('Servidor de Hospedaje por Dias está en línea.');

});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

console.log(`Servidor corriendo en el puerto ${PORT}`);

});