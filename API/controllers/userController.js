const Users = require('../models/User');
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
}

module.exports = UserController;
