const fileUpload = require("express-fileupload");
const path = require("path")

// Environment Variables
const dotenv = require("dotenv");
dotenv.config();

// MySQL
const mysql = require("mysql");

// MySQL Config
const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// File System
const fs = require("fs");

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME
});

// Index Route
const marketingData_index = (req, res) => {
    pool.getConnection((err, connection) => {
        // If salesdata table doesn't exist, create it...
        connection.query('CREATE TABLE IF NOT EXISTS marketingdata (week_number INT(11) NOT NULL, date_created VARCHAR(45) DEFAULT NULL, web_visitors INT(11) DEFAULT NULL, pr_clippings INT(11) DEFAULT NULL, PRIMARY KEY (week_number)) ENGINE=InnoDB DEFAULT CHARSET=utf8;', (err, rows, fields) => {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                console.log("marketingdata table created successfully!");
            }
        });

        // Retrieve everything from marketingdata table and render it into the page
        connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
            // Release the connection
            connection.release();

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
};

// Deleting data
const marketingData_delete = (req, res) => {
    pool.getConnection((err, connection) => {
        connection.query('DELETE FROM marketingdata', (err, rows, fields) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }

            console.log("Deleted all data from marketingdata table & released connection.");
            connection.release();

            res.redirect("/");
        });
    });
}

// Insert original/given marketing data
const marketingData_insertOriginal = (req, res) => {
    // Read the given JSON file
    const rawData = fs.readFileSync('./given_files/marketingDataFixed.json')
    let json_file = JSON.parse(rawData);

    pool.getConnection((err, connection) => {
        connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                console.log("Error connecting to the DB. Connection released.")
                return res.send(err);
            }
            // Only insert the original JSON data if the table is empty.
            if (rows.length > 0) {
                connection.release();
                res.send("The table is not empty. Please clear all data first.");
            } else {
                // Insert the data
                insertData(req, res, json_file, connection);
            }
        })
    });
}

const marketingData_insertNew = (req, res) => {
    // If no file uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send("No files uploaded")
    }

    // If the uploaded file is not a JSON file
    if (req.files.marketingDataJSON.mimetype !== "application/json") {
        res.status(400).send("You can only upload JSON files.")
    }

    // If the uploaded JSON file is greater 4mb (the max json file size)
    if (req.files.marketingDataJSON.size > 4000000) {
        res.status(400).send("The JSON file needs to be less than 4mb.")
    }

    // Check if the JSON is valid
    try {
        JSON.parse(req.files.marketingDataJSON.data);
        console.log("Parsed successfully. Valid JSON file.")
    } catch (error) {
        return res.send("Invalid JSON! Please go back and upload a valid JSON file.")
    }

    // The uploaded file
    const uploadedJSONFile = req.files.marketingDataJSON;

    // Parse the uploaded JSON file
    const rawData = uploadedJSONFile.data;
    let json_file = JSON.parse(rawData);

    if (json_file.marketingData) {
        console.log("Correctly formatted marketing data file")
    } else {
        return res.send("The marketing data JSON file uploaded is not in the correct format")
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.log(err)
            connection.release();
            console.log("Error connecting to the DB. Connection released.")
            return res.send(err);
        }

        connection.query('SELECT * FROM marketingdata', (err, rows, fields) => {
            if (err) {
                console.log(err)
                connection.release();
                console.log("Error connecting to the DB. Connection released.")
                return res.send(err);
            }

            // If marketingdata table has data in it, delete it and insert new data.
            if (rows.length > 0) {
                console.log("There is already data in the database. Deleting it now...");

                // Delete all the data in marketingdata table
                connection.query('DELETE FROM marketingdata', (err, rows, fields) => {
                    if (err) {
                        console.log(err)
                        connection.release();
                        console.log("Error connecting to the DB. Connection released.")
                        return res.send(err);
                    }
                });
                insertData(req, res, json_file, connection)

                // If the marketingdata table is already empty
            } else {
                insertData(req, res, json_file, connection)
            }
        })
    })
}

const insertData = (req, res, json_file, connection) => {
    // Data array, to be inserted into marketingtable
    let newMarketingDataRows = [];
    
    // Loop through the json file and insert each week's data into the database
    Object.keys(json_file.marketingData).forEach(key => {
        const weekNumber = parseInt(key.split("week")[1]);
        const dateCreated = new Date(json_file.marketingData[key].dateCreated).toLocaleString();
        const webVisitors = json_file.marketingData[key].webVisitors;
        const prClippings = json_file.marketingData[key].prClippings;

        newMarketingDataRows.push([weekNumber, dateCreated, webVisitors, prClippings]);
    });

    // Insert into table
    const sql = "INSERT INTO marketingdata (week_number, date_created, web_visitors, pr_clippings) VALUES ?";

    connection.query(sql, [newMarketingDataRows], (error, results, fields) => {
        if (error) {
            console.log(err)
            connection.release();
            console.log("Error connecting to the DB. Connection released.")
            return res.send(err);
        }
    }).on("end", () => {
        console.log("Finished inserting the given data into marketingdata table.");
        // Release the connection
        connection.release();
        console.log("Released the connection")
        res.redirect("/");
    })
}

module.exports = {
    marketingData_index,
    marketingData_delete,
    marketingData_insertOriginal,
    marketingData_insertNew
};