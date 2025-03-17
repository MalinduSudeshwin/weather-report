const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  lastWeatherReport: { type: Date }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
