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
const salesData_index = (req, res) => {
    pool.getConnection((err, connection) => {

        // If salesdata table doesn't exist, create it...
        connection.query('CREATE TABLE IF NOT EXISTS salesdata (date_created VARCHAR(45) NOT NULL, order_name VARCHAR(40) NOT NULL, sales_channel VARCHAR(45) NOT NULL, iso_currency VARCHAR(10) NOT NULL, subtotal FLOAT NOT NULL, discount_amt FLOAT NOT NULL, shipping_amt FLOAT NOT NULL, total_taxes_amt FLOAT NOT NULL, tax_type VARCHAR(10) NOT NULL, total FLOAT NOT NULL, num_items_ordered INT NOT NULL, num_fulfillments INT NOT NULL, num_payments INT NOT NULL, PRIMARY KEY (date_created), UNIQUE INDEX order_name_UNIQUE (order_name ASC))', (err, rows, fields) => {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                console.log("salesData table created successfully!");
            }
        });

        // Retrieve everything from salesData table and render it into the page
        connection.query('SELECT * FROM salesData', (err, rows, fields) => {
            // Release the connection
            connection.release();

            if (err) {
                console.log(err);
                return res.send(err);
            }

            res.render("salesData", {
                title: "Marketing Data",
                salesData: rows
            });
        });
    });
};

// Deleting data
const salesData_delete = (req, res) => {
    pool.getConnection((err, connection) => {
        connection.query('DELETE FROM salesData', (err, rows, fields) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }

            console.log("Deleted all data from salesData table & released connection.");
            connection.release();

            res.redirect("/salesData");
        });
    });
}

// Insert original/given marketing data
const salesData_insertOriginal = (req, res) => {
    // Read the given JSON file
    const rawData = fs.readFileSync('./given_files/salesOrdersFixed.json')
    let json_file = JSON.parse(rawData);

    pool.getConnection((err, connection) => {
        connection.query('SELECT * FROM salesData', (err, rows, fields) => {
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

const salesData_insertNew = (req, res) => {
    // If no file uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send("No files uploaded")
    }

    // If the uploaded file is not a JSON file
    if (req.files.salesDataJSON.mimetype !== "application/json") {
        res.status(400).send("You can only upload JSON files.")
    }

    // If the uploaded JSON file is greater 4mb (the max json file size)
    if (req.files.salesDataJSON.size > 4000000) {
        res.status(400).send("The JSON file needs to be less than 4mb.")
    }

    // Check if the JSON is valid
    try {
        JSON.parse(req.files.salesDataJSON.data);
        console.log("Parsed successfully. Valid JSON file.")
    } catch (error) {
        return res.send("Invalid JSON! Please go back and upload a valid JSON file.")
    }

    // The uploaded file
    const uploadedJSONFile = req.files.salesDataJSON;

    // Parse the uploaded JSON file
    const rawData = uploadedJSONFile.data;
    let json_file = JSON.parse(rawData);

    if (json_file.salesOrders) {
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

        connection.query('SELECT * FROM salesData', (err, rows, fields) => {
            if (err) {
                console.log(err)
                connection.release();
                console.log("Error connecting to the DB. Connection released.")
                return res.send(err);
            }

            // If salesData table has data in it, delete it and insert new data.
            if (rows.length > 0) {
                console.log("There is already data in the database. Deleting it now...");

                // Delete all the data in salesData table
                connection.query('DELETE FROM salesData', (err, rows, fields) => {
                    if (err) {
                        console.log(err)
                        connection.release();
                        console.log("Error connecting to the DB. Connection released.")
                        return res.send(err);
                    }
                });
                insertData(req, res, json_file, connection)

                // If the salesData table is already empty
            } else {
                insertData(req, res, json_file, connection)
            }
        })
    })
}

const insertData = (req, res, json_file, connection) => {
    // Data array, to be inserted into marketingtable
    let newsalesDataRows = [];

    // Loop through the json file and insert each week's data into the database
    Object.keys(json_file.salesOrders).forEach(key => {
        const dateCreated = new Date(json_file.salesOrders[key].dateCreated).toLocaleString();
        const orderName = key
        const salesChannel = json_file.salesOrders[key].salesChannel;
        const isoCurrency = json_file.salesOrders[key].isoCurrency;
        const subtotal = json_file.salesOrders[key].subtotal;
        const discountAmt = json_file.salesOrders[key].discountAmt;
        const shippingAmt = json_file.salesOrders[key].shipping;
        const taxType = json_file.salesOrders[key].taxType;
        const total = json_file.salesOrders[key].total;

        // Total taxes
        let totalTaxesAmt = 0;
        for (const [tax_type, tax_amt] of Object.entries(json_file.salesOrders[key].taxes)) {
            totalTaxesAmt += tax_amt
        }

        // Number of Items Ordered
        let numItemsOrdered = 0;
        for (const [line_item, amount_ordered] of Object.entries(json_file.salesOrders[key].lineItems)) {
            numItemsOrdered += amount_ordered
        }

        // Number of Fulfillments (shippings)
        let numFulfillments = Object.keys(json_file.salesOrders[key].fulfillments).length;

        // Number of payments
        let numPayments = Object.keys(json_file.salesOrders[key].payments).length;

        // Push the data into the data array
        newsalesDataRows.push([dateCreated, orderName, salesChannel, isoCurrency, subtotal, discountAmt, shippingAmt, totalTaxesAmt, taxType, total, numItemsOrdered, numFulfillments, numPayments]);
    });

    // Insert into table
    const sql = "INSERT INTO salesData (date_created, order_name, sales_channel, iso_currency, subtotal, discount_amt, shipping_amt, total_taxes_amt, tax_type, total, num_items_ordered, num_fulfillments, num_payments) VALUES ?";

    connection.query(sql, [newsalesDataRows], (error, results, fields) => {
        if (error) {
            console.log(error)
            connection.release();
            console.log("Error connecting to the DB. Connection released.")
            return res.send(error);
        }
    }).on("end", () => {
        console.log("Finished inserting the given data into salesData table.");
        // Release the connection
        connection.release();
        console.log("Released the connection")
        res.redirect("/salesData");
    })
}

module.exports = {
    salesData_index,
    salesData_delete,
    salesData_insertOriginal,
    salesData_insertNew
};