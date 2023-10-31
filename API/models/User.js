const mongoose = require('mongoose');
const Users = mongoose.model('User', {
  username: { type: String, required: true, minLength: 3 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

module.exports = Users;
