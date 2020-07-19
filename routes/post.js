const router = require("express").Router();
const Posts = require("../models/Posts");
const requireLogin = require("../middleware/requireLogin");
const {upload} = require("../middleware/multer");
const fs = require("fs-extra");
const path = require("path");

router.get("/allpost",requireLogin, (req, res) => {
  Posts.find()
    .populate("postedBy", "_id name")
    .populate("like", "_id")
    .populate("comments.postedBy", "_id name")
    .sort("-createdAt")
    .then((posts) => res.json(posts))
    .catch((err) => res.status(500).json({error: err}));
});

router.get("/getsubpost",requireLogin, (req, res) => {
  Posts.find({postedBy : {$in: req.user.following}})
    .populate("postedBy", "_id name")
    .populate("like", "_id")
    .populate("comments.postedBy", "_id name")
    .sort("-createdAt")
    .then((posts) => res.json(posts))
    .catch((err) => res.status(500).json({error: err}));
});

router.post("/createpost", requireLogin, upload, (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(422).json({ error: "Please add all the fields" });
  }
  if(!req.file) {
    return res.status(422).json({ error: "No Picture!!!" });
  }
  req.user.password = undefined;
  const newPost = {
    title,
    body,
    postedBy: req.user,
    photo: `images/${req.file.filename}`
  };
  Posts.create(newPost)
    .then((result) => res.json({ post: result }))
    .catch((err) => console.log(err));
});

router.get("/mypost", requireLogin, (req,res) => {
    Posts.find({ postedBy: req.user._id})
        .populate("postedBy", "_id name")
        .then(myPost => res.json({myPost}))
        .catch(err => console.log(err))
});

router.put("/like", requireLogin, async(req,res) => {
    const { postId } = req.body;
    if(!postId) {
      return res.status(422).json({error: "Post null"});
    }
    const post = await Posts.findOne({_id: postId}).populate("postedBy", "_id name");
    if(!post) {
      return res.status(422).json({error: "Post is undefined"})
    }
    post.likes.push({_id: req.user._id});
    await post.save();
    res.json({...post._doc});
});

router.put("/unlike", requireLogin, async(req,res) => {
    const { postId } = req.body;
    if(!postId) {
      return res.status(422).json({error: "Post null"});
    }
    const post = await Posts.findOne({_id: postId}).populate("postedBy", "_id name");
    if(!post) {
      return res.status(422).json({error: "Post is undefined"})
    }
    post.likes.pull({_id: req.user._id});
    await post.save();
    res.json({...post._doc});
});

router.put("/comment", requireLogin, (req,res) => {
  const { text, postId } = req.body;
  const comment = {
    text,
    postedBy: req.user._id
  }
  Posts.findByIdAndUpdate(postId, {
    $push: {comments: comment}
  }, {
    new: true
  }).populate("comments.postedBy", "_id name").populate("postedBy", "_id name")
    .exec((err, result) => {
      if(err) {
        return res.status(422).json({error: err})
      } else {
        return res.json(result);
      }
    })
});

router.delete("/deletepost/:postId", requireLogin, (req,res) => {
  Posts.findOne({_id : req.params.postId })
    .populate("postedBy", "_id name")
    .exec((err,post) => {
      if(err || !post) {
        return res.status(422).json({error: err})
      }
      if(post.postedBy._id.toString() === req.user._id.toString()) {
        fs.unlink(path.join(`public/${post.photo}`));
        post.remove()
        .then(result => res.json(result))
        .catch(error => console.log(error))
      }
    })
});


module.exports = router;
