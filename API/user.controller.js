const Users = require('./User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const secretKey = 'secret'; // Reemplaza con tu secreto real

const UserController = {
  get: async (req, res) => {
    const { id } = req.params;
    const user = await Users.findOne({ _id: id });
    res.status(200).send(user);
  },
  list: async (req, res) => {
    const users = await Users.find();
    res.status(200).send(users);
  },
  create: async (req, res) => {
    try {
      const user = new Users(req.body);
      const savedUser = await user.save();
      res.status(201).json(savedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear el usuario' });
    }
  },
  update: async (req, res) => {
    const { id } = req.params;
    const user = await Users.findOne({ _id: id });
    Object.assign(user, req.body);
    await user.save();
    res.sendStatus(204);
  },
  destroy: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await Users.deleteOne({ _id: id });
      if (result.deletedCount > 0) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
  },
  authenticate: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Verifica si se están enviando los datos correctamente
      if (!username || !password) {
        return res.status(400).json({ message: 'Los campos de usuario y contraseña son obligatorios' });
      }

      // Buscar el usuario en la base de datos
      const user = await Users.findOne({ username });

      // Verificar las credenciales
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Crear un token JWT y enviarlo como respuesta
      const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en la autenticación' });
    }
  },
};

module.exports = UserController;
