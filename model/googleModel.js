const mongoose = require('mongoose');

const googleSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
});

const User = mongoose.model('googleAuthUsers', googleSchema);
module.exports = User;
