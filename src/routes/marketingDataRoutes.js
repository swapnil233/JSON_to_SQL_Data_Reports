"use strict";

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

    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    // Retrieve everything from marketingdata table and render it into the page
    connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        res.render("marketingData", {
            title: "Marketing Data",
            marketingData: rows
        });
    });
});

// Delete all table data
router.post("/delete_original", (req, res) => {

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

// Re-insert the original (given) data
router.post("/insert_original", (req, res) => {

    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    // Read the given JSON file
    const rawData = fs.readFileSync('./given_files/marketingDataFixed.json')
    let json_file = JSON.parse(rawData);

    // Don't write any data if table isn't empty
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

            // Data array, to be inserted into table via SQL
            let dataArray = [];

            // Loop through the json file and insert each week's data into the database
            Object.keys(json_file.marketingData).forEach(key => {
                const weekNumber = parseInt(key.split("week")[1]);
                const dateCreated = new Date(json_file.marketingData[key].dateCreated).toLocaleString();
                const webVisitors = json_file.marketingData[key].webVisitors;
                const prClippings = json_file.marketingData[key].prClippings;

                dataArray.push([weekNumber, dateCreated, webVisitors, prClippings]);
            });

            // Insert into table
            const sql = "INSERT INTO marketingdata (week_number, date_created, web_visitors, pr_clippings) VALUES ?";

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

// Let users insert their own JSON file
router.post("/insert_own", (req, res) => {
    // First delete all data from DB
})

module.exports = router;