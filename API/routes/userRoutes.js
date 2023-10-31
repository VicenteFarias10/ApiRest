const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rutas relacionadas con usuarios
router.get('/users', userController.list);
router.post('/users', userController.create);
router.get('/users/:id', userController.get);
router.put('/users/:id', userController.update);
router.patch('/users/:id', userController.update);
router.delete('/users/:id', userController.destroy);

module.exports = router;
