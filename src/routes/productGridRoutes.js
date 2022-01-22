const express = require("express");
const router = express.Router();

// MySQL
const mysql = require("mysql");

// File System
const fs = require("fs");

// Environment Variables
const dotenv = require("dotenv");
dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

router.get("/", (req, res) => {

    // const connection = mysql.createConnection({
    //     host:       DB_HOST,
    //     user:       DB_USERNAME,
    //     password:   DB_PASSWORD,
    //     database:   DB_NAME
    // });

    // // Retrieve everything from marketingdata table and render it into the page
    // connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
    //     if (err) {
    //         console.log(err);
    //         return res.send(err);
    //     }

    //     res.render("marketingData", {
    //         title: "Marketing Data",
    //         marketingData: rows
    //     });
    // });

    res.render("productGrid", {
        title: "Product Grid",
    })
});

module.exports = router;