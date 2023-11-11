const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const app = express();
const port = 3000;
require('dotenv').config({ path: './env/config.env' });
const jwtMiddleware = require('./middlewares/jwtMiddleware'); 
const bcrypt = require('bcrypt'); 
app.use(cors());
const jwt = require('jsonwebtoken');



mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

// middleware JWT para autenticación
app.use(jwtMiddleware);

// Manejar errores de tokens invalidos
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Token no válido' });
  }
  next();
});

// Ruta de user
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
  const { username, email, password,sede, role, patente, } = req.body; // Agrega "sede" a la destructuración

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
        // Agrega "sede" al usuario
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

app.use(express.static('app'));

app.get('/', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + '/index.html');
});

app.get('*', (req, res) => {
  res.status(404).send('Esta Página No Existe');
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
      // Generar el token JWT utilizando la clave secreta de las variables de entorno
      const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.status(200).json({ token }); // Responder con el token JWT
    } else {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.listen(port, () => {
  console.log('Arrancando La Aplicación en el puerto ' + port);
});
