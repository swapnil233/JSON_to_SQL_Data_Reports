const express = require("express");
const app = express()
const indexRoute = express.Router();

// Environment Variables
const dotenv = require("dotenv")
dotenv.config();

// Templating engine
app.set("views", "./src/views");
app.set("view engine", "ejs");

indexRoute.get("/", (req, res) => {
    res.render("index", { title: "Index" })
})

module.exports = indexRoute;