const router = require("express").Router();
const Users = require("../models/Users");
const { upload } = require("../middleware/multer");
const requireLogin = require("../middleware/requireLogin");
const { JWT_SECRET } = require("../config/key");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs-extra");
const path = require("path");

router.get("/protected", requireLogin, (req, res) => {
  res.send("hallo amar");
});

router.post("/signup", upload, (req, res) => {
  const { name, email, password } = req.body;
  const { file } = req;
  
  if (!name || !email || !password) {
    return res.status(422).json({ error: "Please add all fields" });
  }
  Users.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        fs.unlink(path.join(`public/images/${req.file.filename}`));
        return res.status(422).json({ error: "Email already exist" });
      }
      if (file) {
        const newUser = {
          name,
          email,
          password,
          picture: `images/${req.file.filename}`,
        };
        Users.create(newUser)
          .then((user) => res.json({ message: "Success register" }))
          .catch((err) => console.log(err));
      } else {
        const newUser = {
          name,
          email,
          password,
        };
        Users.create(newUser)
          .then((user) => res.json({ message: "Success register" }))
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => {
      console.log(err)
      return res.status(422).json({ error: err });
    });
});

router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: "Please add email or password" });
  }
  Users.findOne({ email: email }).then((userSaved) => {
    if (!userSaved) {
      return res.status(422).json({ error: "Invalid email or password" });
    }
    bcrypt
      .compare(password, userSaved.password)
      .then((doMatch) => {
        if (doMatch) {
          // res.json({message: "Success signed in"});
          const token = jwt.sign({ _id: userSaved._id }, JWT_SECRET);
          const { _id, name, email, followers, following, picture } = userSaved;
          res.json({
            token: token,
            user: { _id, name, email, followers, following, picture },
          });
        } else {
          return res.status(422).json({ error: "Invalid email or password" });
        }
      })
      .catch((err) => console.log(err));
  });
});

module.exports = router;
