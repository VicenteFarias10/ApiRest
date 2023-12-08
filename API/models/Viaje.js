// Viaje.js
const mongoose = require('mongoose');

const viajeSchema = new mongoose.Schema({
  origen: { type: String, required: true },
  destino: { type: String, required: true },
  precio: { type: Number, required: true },
  asientosDisponibles: { type: Number, required: true },
  conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pasajeros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viajes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Viaje' }],
  horaInicio: { type: String, required: true },
  diaInicio: { type: String, required: true },
  iniciado: {
    type: Boolean,
    default: false,
  },
});



const Viaje = mongoose.model('Viaje', viajeSchema);

module.exports = Viaje;
