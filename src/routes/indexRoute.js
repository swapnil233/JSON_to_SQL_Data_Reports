const express = require("express");
const app = express()
const indexRoute = express.Router();
const mysql = require("mysql");
const fs = require("fs");

// Environment Variables
const dotenv = require("dotenv");
const e = require("express");
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

        res.render("index", {
            title: "Marketing Data",
            marketingData: rows
        });
    });
});

// Delete data
indexRoute.post("/delete_original", (req, res) => {
    // When the user clicks the clear button, delete all the data from the database
    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    connection.query('DELETE FROM marketingdata', (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        console.log("All data has been deleted from the database");
        res.redirect("/");
    });
})

// Re-insert the original data
indexRoute.post("/insert_original", (req, res) => {

    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    // Read marketing data
    const rawData = fs.readFileSync('./given_files/marketingDataFixed.json')
    let json_file = JSON.parse(rawData);

    // Check if any data exists in the database. If so, show a window.alert to the user
    connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        // Only insert the original data if there is no data in the database
        if (rows.length > 0) {
            console.log("There is already data in the database. Please delete it first.");
            res.redirect("/");
        } else {
            // Insert the data into the database
            let dataArray = [];

            // Loop through the json file and insert each week into the database
            Object.keys(json_file.marketingData).forEach(key => {
                const weekNumber = parseInt(key.split("week")[1]);
                const dateCreated = new Date(json_file.marketingData[key].dateCreated).toLocaleString();
                const webVisitors = json_file.marketingData[key].webVisitors;
                const prClippings = json_file.marketingData[key].prClippings;

                dataArray.push([weekNumber, dateCreated, webVisitors, prClippings]);
            });

            let sql = "INSERT INTO marketingdata (week_number, date_created, web_visitors, pr_clippings) VALUES ?";
            connection.query(sql, [dataArray], (error, results, fields) => {
                if (error) {
                    console.log(error);
                    return res.send(error);
                }
            }).on("end", () => {
                res.redirect("/");
            })
        }
    })
})

// const insertFileFromData = (json_file) => {

//     const connection = mysql.createConnection({
//         host: DB_HOST,
//         user: DB_USERNAME,
//         password: DB_PASSWORD,
//         database: DB_NAME
//     });


// }

indexRoute.post("/insert_own", (req, res) => {
    // First delete all data from DB
})

module.exports = indexRoute;