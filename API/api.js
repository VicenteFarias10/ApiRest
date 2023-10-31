const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const app = express();
const port = 3000;
require('dotenv').config({ path: './env/config.env' });
const jwtMiddleware = require('./middlewares/jwtMiddleware'); // Importa el middleware JWT
const bcrypt = require('bcrypt'); 
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

// Middleware JWT para autenticación
app.use(jwtMiddleware);

// Manejador de errores para tokens no válidos
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Token no válido' });
  }
  next();
});

// Rutas para interactuar con usuarios
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
  const { username, email, password } = req.body; // Obtiene los datos del usuario

  // Hashea la contraseña antes de guardarla
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Error al hashear la contraseña' });
    }

    try {
      // Crea un nuevo usuario con la contraseña hasheada
      const newUser = new User({
        username,
        email,
        password: hash, // Almacena el hash en lugar del texto claro
      });

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
      // No necesitas volver a firmar el token aquí, ya que ya se hizo en el middleware.
      // Solo devuelve el token anterior.
      res.status(200).json({ token: req.user });
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
