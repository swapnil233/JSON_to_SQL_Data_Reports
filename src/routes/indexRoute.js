const express = require("express");
const app = express()
const indexRoute = express.Router();
const mysql = require("mysql");

// Environment Variables
const dotenv = require("dotenv")
dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Templating engine
app.set("views", "./src/views");
app.set("view engine", "ejs");

indexRoute.get("/", (req, res) => {

    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        console.log(rows);
        res.render("index", {
            title: "Marketing Data",
            marketingData: rows
        });
    });
});

module.exports = indexRoute;