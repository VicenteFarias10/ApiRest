const express = require('express');
const mongoose = require('mongoose');
const user = require('./user.controller');
const Users = require('./User');
const app = express();
const port = 3000;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { expressjwt: jwtt } = require("express-jwt");

jwtt({
  secret: "secreto",
  audience: "http://myapi/protected",
  issuer: "http://issuer",
  algorithms: ["HS256"],
});

const secretKey = 'secreto'; 

app.use(cors());

mongoose.connect('mongodb+srv://vichofarias:vichofariasJalvarez2001@cluster0.cxhsze4.mongodb.net/miapp?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

// Middleware JWT
app.use(
  jwtt({
    secret: secretKey,
    algorithms: ['HS256'],
  }).unless({ path: ['/login', '/','/users'] })  // Agrega '/' aquí para permitir acceso público a la raíz
);

// Manejador de errores para tokens no válidos
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Token no válido' });
  }
  next();
});

app.get('/users', user.list);
app.post('/users', user.create);
app.get('/users/:id', user.get);
app.put('/users/:id', user.update);
app.patch('/users/:id', user.update);
app.delete('/users/:id', user.destroy);

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
    const user = await Users.findOne({ username }); // Buscar el usuario por nombre de usuario

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Comparar la contraseña proporcionada con la contraseña almacenada (sin hash)
    if (password === user.password) {
      // Autenticación exitosa: crear un token JWT
      const token = jwt.sign({ username }, secretKey);
      res.status(200).json({ token });
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
