const express = require("express");
const app = express()

// Environment Variables
const dotenv = require("dotenv");
dotenv.config();

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.PORT || 3000;

// Parsing Middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Templating engine
app.set("views", "./src/views");
app.set("view engine", "ejs");

// Static Files
app.use(express.static('public'));
app.use("/css", express.static(__dirname + "public/css"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/js", express.static(__dirname + "public/js"))

// Routes
const indexRoute = require("./src/routes/indexRoute");
app.get("/", indexRoute)

// 404 Page
app.get("*", (req, res) => {
    res.render("404")
})

// Listen
app.listen(PORT, (error) => {
    if (error) {
        return console.log("Server error!")
    }

    console.log(`App listening on port ${PORT}`)
})


