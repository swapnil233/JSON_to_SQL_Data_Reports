const express = require("express");
const app = express()
const fs = require("fs");
const mysql = require("mysql");

// Routes
const marketingDataRoutes = require("./src/routes/marketingDataRoutes");
const productGridRoutes = require("./src/routes/productGridRoutes");
const salesDataRoutes = require("./src/routes/salesDataRoutes");

// Environment Variables
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.redirect("/marketingdata");
});

// Router Middlewares
app.use("/marketingData", marketingDataRoutes);
app.use("/productGrid", productGridRoutes)
app.use("/salesData", salesDataRoutes);

// Templating engine
app.set("views", "./src/views");
app.set("view engine", "ejs");

// Static Files
app.use(express.static('public'));
app.use("/css", express.static(__dirname + "public/css"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/js", express.static(__dirname + "public/js"))

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