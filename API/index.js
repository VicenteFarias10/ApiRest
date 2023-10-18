const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb+srv://vichofarias:vichofariasJalvarez2001@cluster0.cxhsze4.mongodb.net/miapp?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definición del modelo de usuario en la base de datos
const User = mongoose.model('User', {
  username: String,
  email: String,
  password: String,
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
  const userData = req.body;

  try {
    const newUser = new User(userData);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

// Otras rutas y operaciones de usuario (actualización, eliminación) aquí

app.listen(port, () => {
  console.log('Arrancando la aplicación en el puerto ' + port);
});
