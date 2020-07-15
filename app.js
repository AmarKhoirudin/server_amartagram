const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const { MONGOURI } = require("./config/key");
mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
mongoose.connection.on("connected", () => {
    console.log("connected mongo db local")
})

mongoose.connection.on("error", () => {
    console.log("error connect in db")
})

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")))
app.use(require("./routes/auth"));
app.use(require("./routes/post"));
app.use(require("./routes/user"));

const PORT = process.env.PORT ||5000;

// if(process.env.NODE_ENV === "production"){
//     app.use(express.static("client/build"));
//     const path = require("path");
//     app.get("*",(req,res) => {
//         res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
//     })
// }
// package.json
// "heroku-postbuild" : "NPM_CONFIG_PRODUCTION=false npm install --prefix client && npm run build --prefix client",

app.listen(PORT, () => {
    console.log(`Server isruning on port ${PORT}`)
})

