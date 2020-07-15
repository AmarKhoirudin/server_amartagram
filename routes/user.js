const router = require("express").Router();
const requireLogin = require("../middleware/requireLogin");
const {upload} = require("../middleware/multer");
const fs = require("fs-extra");
const path = require("path");
const Posts = require("../models/Posts");
const Users = require("../models/Users");

router.get("/user/:id", (req, res) => {
  const { id } = req.params;
  Users.findOne({ _id: id })
    .select("-password").populate("followers", "_id")
    .then((user) => {
      Posts.find({ postedBy: id })
        .populate("postedBy", "_id name")
        .exec((err, posts) => {
          if (err) {
            return res.status(422).json({ error: err });
          }
          return res.json({ user, posts });
        });
    })
    .catch((err) => res.status(404).json({ error: "User Not Found!!!" }));
});

router.put("/follow", requireLogin, (req, res) => {
  const { followId } = req.body;
  const { _id } = req.user;
  Users.findByIdAndUpdate(
    followId,
    {
      $push: { followers: _id },
    },
    { new: true },
    (err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      }
      Users.findByIdAndUpdate(
        _id,
        {
          $push: { following: followId },
        },
        { new: true }
      )
        .select("-password")
        .then((result) => res.json(result))
        .catch((err) => {
          return res.status(422).json({ error: err });
        });
    }
  );
});

router.put("/unfollow", requireLogin, (req, res) => {
  const { unfollowId } = req.body;
  const { _id } = req.user;
  Users.findByIdAndUpdate(
    unfollowId,
    {
      $pull: { followers: _id },
    },
    { new: true },
    (err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      }
      Users.findByIdAndUpdate(
        _id,
        {
          $pull: { following: unfollowId },
        },
        { new: true }
      )
        .select("-password")
        .then((result) => res.json(result))
        .catch((err) => {
          return res.status(422).json({ error: err });
        });
    }
  );
});

router.put("/update-picture", requireLogin,upload, async(req,res) => {
  try {
    const { _id } = req.user;
    const user = await Users.findOne({_id});
    const { picture } = user;
    if(!user) {
      // await fs.unlink(path.join(`public/${req.file.filename}`));
      return res.status(422).json({error : "user not found"});
    }
    if(picture.toString() !== "images/user.svg") {
      await fs.unlink(path.join(`public/${picture}`));
      user.picture = `images/${req.file.filename}`
      await user.save();
      return res.json({message: "Success update Pic", user});
    } else {
      user.picture = `images/${req.file.filename}`
      await user.save();
      return res.json({message: "Success update Pic", user});
    }
  } catch (error) {
    return res.status(500).json({error})
  }
})

module.exports = router;
