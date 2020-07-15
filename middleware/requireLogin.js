const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/key");
const USers = require("../models/Users");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  // Authorization === Bearer
  if (!authorization) {
    return res.status(201).json({ error: "You must be logged id" });
  }
  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: "you must be logged in" });
    }
    const { _id } = payload;
    USers.findById(_id).then((userData) => {
      req.user = userData;
      next();
    });
  });
};
