const router = require("express").Router();
const Users = require("../models/Users");
const { upload } = require("../middleware/multer");
const requireLogin = require("../middleware/requireLogin");
const { JWT_SECRET,EMAIL } = require("../config/key");
const { sendEmail } = require("../helpers/nodeMailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

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
      const tempalateEmail = {
        from: 'no-replay@amartagram.com',
        to: email,
        subject: "SignUp Success",
        html : `<h1>Welcome to Amartagram</h1>`
      }
      sendEmail(tempalateEmail);
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

router.post("/reset-password", (req,res) => {
  crypto.randomBytes(32,(err,buffer) => {
    if(err) {
      console.log(err);
    }
    const token = buffer.toString("hex");
    Users.findOne({email: req.body.email})
      .then(user => {
        if(!user) {
          return res.status(422).json({error: "User not found"})
        }
        user.resetToken = token;
        user.expiredToken = Date.now() + 3600000;
        user.save().then(result=> {
          const tempalateEmail = {
            from: 'no-replay@amartagram.com',
            to: result.email,
            subject: "Reset Password",
            html : `
              <p>You Request for password reset</p>
              <h5>Clik in this <a href="${EMAIL}/reset/${token}">Link</a> to Reset Password</h5>
            `
          }
          sendEmail(tempalateEmail);
          res.json({message: "Check your email"})
        })
      })
  })
});

router.post("/new-password", (req,res) => {
  const { password, token } = req.body;
  Users.findOne({resetToken : token, expiredToken:{$gt: Date.now()}})
    .then(user => {
      if(!user){
        return res.status(422).json({error: "Try again session expires"})
      }
      user.password = password;
      user.resetToken = undefined;
      user.expiredToken = undefined;
      user.save()
        .then(savedUser=>{
          res.json({message: "Update Password success"})
        })
        .catch(err => res.status(422).json({error: err}));
    }).catch(err => res.status(422).json({error: err}));
})

module.exports = router;


// rkiyloiyisrzlmpz