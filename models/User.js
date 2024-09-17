const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'pro'], default: 'user' }, // Role or status field
});

module.exports = mongoose.model('User', userSchema);
