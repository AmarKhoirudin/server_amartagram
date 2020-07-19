const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  picture : {
    type: String,
    default: "images/user.svg"
  },
  resetToken: {
    type: String
  },
  expiredToken : {
    type: Date
  },
  following: [{type: ObjectId, ref: "User"}],
  followers: [{type: ObjectId, ref: "User"}]
});

userSchema.pre("save", async function () {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

module.exports = mongoose.model("User", userSchema);
