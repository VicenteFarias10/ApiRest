const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Viaje = require('./models/Viaje');
const { getTransporter, enviarCorreoSolicitud } = require('./transporter');
const app = express();
const port = 3000;
require('dotenv').config({ path: './env/config.env' });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const http = require('http');
const socketIO = require('socket.io');
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(express.json());
app.use(cors());


io.on('connection', (socket) => {
  console.log('Usuario conectado');

  // Maneja eventos aquí (iniciar y finalizar viajes)
  socket.on('iniciarViaje', (data) => {
    // Lógica para iniciar el viaje
    console.log('Viaje iniciado:', data.viajeId);

    // Emitir un evento a todos los clientes para informar sobre el inicio del viaje
    io.emit('viajeIniciado', { mensaje: '¡Viaje en curso!', viajeId: data.viajeId });
  });

  socket.on('finalizarViaje', (data) => {
    // Lógica para finalizar el viaje
    console.log('Viaje finalizado:', data.viajeId);

    // Emitir un evento a todos los clientes para informar sobre la finalización del viaje
    io.emit('viajeFinalizado', { mensaje: '¡Viaje finalizado!', viajeId: data.viajeId });
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});


// Middleware JWT para autenticación
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('UnauthorizedError:', err.message);
    res.status(401).json({ error: 'Token no válido' });
  } else if (err.name === 'Error') {
    console.error('Error en la autenticación del usuario:', err.message);
    res.status(401).json({ error: 'Error en la autenticación del usuario' });
  } else {
    // Si no es un error relacionado con la autorización, pasa al siguiente middleware
    next();
  }
});

// Middleware para decodificar el token y configurar req.user
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Aquí puedes manejar errores específicos relacionados con la decodificación del token
      console.error('Error al decodificar el token:', err.message);
      next({ name: 'Error', message: 'Error al decodificar el token' });
    }
  }

  next();
});

// Rutas de usuario
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

app.post('/users', async (req, res) => {
  const { username, email, password, sede, role, patente } = req.body;

  // Validar que el campo "rol" sea válido (conductor o pasajero)
  if (role !== 'conductor' && role !== 'pasajero') {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  // Hashea la contraseña antes de guardarla
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Error al hashear la contraseña' });
    }

    try {
      // Crea un usuario nuevo con el hash
      const newUser = new User({
        username,
        email,
        password: hash,
        sede,
        role,
      });

      // Añadir la patente solo si es un conductor
      if (role === 'conductor') {
        newUser.patente = patente;
      }

      // Guarda el usuario en la base de datos
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    } catch (error) {
      return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
  });
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      req.user = { username: user.username, role: user.role };
      res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});




app.post('/viajes', async (req, res) => {
  const { origen, destino, precio, asientosDisponibles, horaInicio,diaInicio, } = req.body;

  const conductorUsername = req.user.username;

  if (!conductorUsername) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  // Validar el precio
  if (precio < 1000 || precio > 10000) {
    return res.status(400).json({ error: 'El precio debe estar entre 1000 y 10000' });
  }
  if (asientosDisponibles < 0 || asientosDisponibles > 9) {
    return res.status(400).json({ error: 'La cantidad de asientos disponibles debe estar entre 0 y 9' });
  }

  try {
    const conductor = await User.findOne({ username: conductorUsername });

    if (!conductor) {
      return res.status(400).json({ error: 'Conductor no encontrado' });
    }

    const nuevoViaje = new Viaje({
      origen,
      destino,
      precio,
      asientosDisponibles,
      horaInicio,
      diaInicio,
      conductor: conductor._id,
      pasajeros: [],
    });

    const viajeCreado = await nuevoViaje.save();

    conductor.viajes = conductor.viajes || [];
    conductor.viajes.push(viajeCreado);

    await conductor.save();

    res.status(201).json({ mensaje: 'Viaje creado exitosamente', viaje: viajeCreado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el viaje' });
  }
});

app.get('/viajes/:id', async (req, res) => {
  try {
    const viaje = await Viaje.findById(req.params.id).populate('conductor').populate('pasajeros');
    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    res.status(200).json({ viaje });
  } catch (error) {
    console.error('Error al obtener detalles del viaje:', error);
    res.status(500).json({ error: 'Error al obtener detalles del viaje' });
  }
});

// Ruta para obtener viajes disponibles
app.get('/viajes-disponibles', async (req, res) => {
  console.log('Recibida solicitud para /viajes-disponibles');
  try {
    const viajesDisponibles = await Viaje.find({ asientosDisponibles: { $gt: 0 } }).populate('conductor');
    res.status(200).json({ viajes: viajesDisponibles });
  } catch (error) {
    console.error('Error al obtener los viajes disponibles:', error);
    res.status(500).json({ error: 'Error al obtener los viajes disponibles' });
  }
});

app.post('/solicitar-viaje', async (req, res) => {
  const { viajeId, username } = req.body;

  try {
    const viaje = await Viaje.findById(viajeId);

    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    if (viaje.asientosDisponibles === 0) {
      return res.status(400).json({ error: 'No hay asientos disponibles en este viaje' });
    }

    // Disminuir en 1 el número de asientos disponibles
    viaje.asientosDisponibles--;

    // Guarda el viaje actualizado en la base de datos
    await viaje.save();

    // Buscar al usuario por su nombre de usuario
    const pasajero = await User.findOne({ username });

    if (!pasajero) {
      return res.status(404).json({ error: 'Pasajero no encontrado' });
    }

    // Obtener el conductor del viaje
    const conductor = await User.findById(viaje.conductor);

    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Agregar el ID del pasajero al array de pasajeros en el viaje
    viaje.pasajeros.push(pasajero._id);

    // Guarda el viaje nuevamente para asegurarte de que los cambios se reflejen
    await viaje.save();

    // Ahora utiliza populate con una cadena después de haber guardado los cambios
    const viajePopulado = await Viaje.findById(viaje._id).populate('conductor').populate('pasajeros');

    const transporterPasajero = await getTransporter('pasajero');
    const transporterConductor = await getTransporter('conductor');

    // Envía el correo electrónico al pasajero y al conductor
    await enviarCorreoSolicitud(transporterPasajero, viajePopulado, pasajero, conductor);
    await enviarCorreoSolicitud(transporterConductor, viajePopulado, pasajero, conductor);

    res.status(200).json({ mensaje: 'Solicitud de viaje exitosa', viaje: viajePopulado, username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud de viaje' });
  }
})

app.post('/viajes/:id/iniciar', async (req, res) => {
  const viajeId = req.params.id;

  try {
    const viaje = await Viaje.findById(viajeId);

    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

   
    if (viaje.iniciado) {
      return res.status(400).json({ error: 'El viaje ya ha sido iniciado' });
    }

    viaje.iniciado = true;
    await viaje.save();

    res.status(200).json({ mensaje: 'Viaje iniciado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar el viaje' });
  }
});

// Ruta para finalizar un viaje
app.post('/viajes/:id/finalizar', async (req, res) => {
  const viajeId = req.params.id;

  try {
    const viaje = await Viaje.findById(viajeId);

    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    // Eliminar el viaje de la base de datos
    await Viaje.findByIdAndDelete(viajeId);

    // Emitir un evento 'viajeFinalizado' con el ID del viaje
    io.emit('viajeFinalizado', { viajeId });

    res.status(200).json({ mensaje: 'Viaje finalizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al finalizar el viaje' });
  }
});

app.get('/', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + '/index.html');
});



server.listen(port, () => {
  console.log('Arrancando La Aplicación en el puerto ' + port);
});