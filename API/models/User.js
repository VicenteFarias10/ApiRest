// User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minLength: 3 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sede: { type: String, required: true },
  role: { type: String, enum: ['conductor', 'pasajero'] },
  patente: { type: String },
  viajes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Viaje' }], // Agrega este campo para almacenar los viajes del usuario
});

const User = mongoose.model('User', userSchema);

module.exports = User;
