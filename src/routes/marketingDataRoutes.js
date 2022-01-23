"use strict";

const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const path = require("path")

// MySQL
const mysql = require("mysql");

// File System
const fs = require("fs");

// Environment Variables
const dotenv = require("dotenv");
dotenv.config();

// Middlewares
router.use(express.urlencoded({
    extended: true
}));
router.use(express.json());
router.use(fileUpload())

const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

router.get("/", (req, res) => {

    const pool = mysql.createPool({
        connectionLimit: 10,
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    pool.getConnection((err, connection) => {
        // Retrieve everything from marketingdata table and render it into the page
        connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
            // Release the connection
            connection.release();
            console.log("Connection released!");

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
});

// Delete all table data
router.post("/delete_original", (req, res) => {

    const pool = mysql.createPool({
        connectionLimit: 10,
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    pool.getConnection((err, connection) => {
        connection.query('DELETE FROM marketingdata', (err, rows, fields) => {
            connection.release();
            console.log("Deleted all data from marketingdata table & released connection.");

            if (err) {
                console.log(err);
                return res.send(err);
            }

            res.redirect("/");
        });
    });
})

// Re-insert the original (given) data
router.post("/insert_original", (req, res) => {

    const pool = mysql.createPool({
        connectionLimit: 10,
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    // Read the given JSON file
    const rawData = fs.readFileSync('./given_files/marketingDataFixed.json')
    let json_file = JSON.parse(rawData);

    pool.getConnection((err, connection) => {
        // Don't write any data if table isn't empty
        connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }

            // Only insert the original data if there is no data in the database
            if (rows.length > 0) {
                connection.release();
                res.send("The table is not empty. Please clear all data first.");
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
                    connection.release();
                    console.log("Inserted original data into marketingdata table & released connection.");
                    res.redirect("/");
                })
            }
        })
    });
})

// Let users insert their own JSON file
router.post('/upload', async (req, res) => {

    // If no file uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send("No files uploaded")
    }

    // If the uploaded file is not a JSON file, return error
    if (req.files.marketingDataJSON.mimetype !== "application/json") {
        res.status(400).send("You can only upload JSON files")
    }

    // If the uploaded json file is greater 4mb (the max json file size), return error
    if (req.files.marketingDataJSON.size > 4000000) {
        res.status(400).send("The file is too large. Please upload a smaller file.")
    }

    const uploadedJSONFile = req.files.marketingDataJSON;
    const uploadPath = path.join(__dirname, "../../uploads/") + uploadedJSONFile.name;

    // Put the uploaded file in /uploads folder
    await uploadedJSONFile.mv(uploadPath, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        // Read the uploaded JSON file
        const rawData = fs.readFileSync(uploadPath)
        let json_file = JSON.parse(rawData);

        const pool = mysql.createPool({
            connectionLimit: 10,
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        pool.getConnection((err, connection) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }

            // Don't write any data if table isn't empty
            connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
                // Release the connection
                connection.release();

                if (err) {
                    console.log(err);
                    return res.send(err);
                }

                // Only insert the given data if there is no data in the database
                if (rows.length > 0) {
                    console.log("There is already data in the database. Deleting it now...");
                    // Delete all the data in marketingdata table
                    connection.query('DELETE FROM marketingdata', (err, rows, fields) => {
                        // Release the connection
                        connection.release();

                        if (err) {
                            console.log(err);
                            return res.send(err);
                        }
                    });
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
                        // Release the connection
                        connection.release();

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
    });
});

module.exports = router;