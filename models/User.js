const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  resetPasswordExpires: Date,
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
