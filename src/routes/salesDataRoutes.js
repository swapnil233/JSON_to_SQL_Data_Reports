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

    // Retrieve everything from salesdata table and render it into the page
    connection.query('SELECT * FROM salesdata', (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        res.render("salesData", {
            title: "Sales Data",
            salesData: rows
        })
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

    connection.query('DELETE FROM salesdata', (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        console.log("All data has been deleted from salesdata table");
        res.redirect("/salesData");
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
    const rawData = fs.readFileSync('./given_files/salesOrdersFixed.json');
    const json_file = JSON.parse(rawData);

    // Retrieve everything from salesdata table and render it into the page
    connection.query('SELECT * FROM salesdata', (err, rows, fields) => {

        // Don't write any data if table isn't empty
        connection.query('SELECT * FROM salesdata', (err, rows, fields) => {
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

                // Loop through the json file and insert the data into sqldb
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
                    dataArray.push([dateCreated, orderName, salesChannel, isoCurrency, subtotal, discountAmt, shippingAmt, totalTaxesAmt, taxType, total, numItemsOrdered, numFulfillments, numPayments]);
                });

                console.log(dataArray);

                // Insert into table
                const sql = "INSERT INTO salesData (date_created, order_name, sales_channel, iso_currency, subtotal, discount_amt, shipping_amt, total_taxes_amt, tax_type, total, num_items_ordered, num_fulfillments, num_payments) VALUES ?";

                connection.query(sql, [dataArray], (error, results, fields) => {
                    if (error) {
                        console.log(error);
                        return res.send(error);
                    }
                }).on("end", () => {
                    console.log("Sales data has been inserted into the database");
                    res.redirect("/salesData");
                })
            }
        })
    });
})

// Let users insert their own JSON file
router.post('/upload', (req, res) => {

    // If no file uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send("No files uploaded")
    }

    // If the uploaded file is not a JSON file, return error
    if (req.files.salesDataJSON.mimetype !== "application/json") {
        res.status(400).send("You can only upload JSON files")
    }

    // If the uploaded json file is greater 4mb (the max json file size), return error
    if (req.files.salesDataJSON.size > 4000000) {
        res.status(400).send("The file is too large. Please upload a smaller file.")
    }

    const uploadedJSONFile = req.files.salesDataJSON;
    const uploadPath = path.join(__dirname, "../../src/uploads/sales_data/") + uploadedJSONFile.name;

    // Put the uploaded file in /uploads/sales_data folder
    uploadedJSONFile.mv(uploadPath, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        // Create a connection pool
        const pool = mysql.createPool({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        // Connect to the database
        pool.getConnection((err, connection) => {
            if (err) {
                connection.release();
                console.log(err);
                return res.send("There was an error connecting to the databse");
            }

            // Only write data if table is empty
            connection.query('SELECT * FROM salesdata', (err, rows, fields) => {
                if (err) {
                    console.log(err);

                    // Release the connection
                    connection.release();

                    return res.send(err);
                }
                
                if (rows.length > 0) {
                    console.log("There is already data in the database. Deleting it now...");

                    // Delete all the data in salesdata table
                    connection.query('DELETE FROM salesdata', (err, rows, fields) => {
                        if (err) {
                            console.log(err)
                            return res.send(err);
                        }
                    });

                    // Read the uploaded JSON file
                    const rawData = fs.readFileSync(uploadPath)
                    let json_file = JSON.parse(rawData);

                    // Data array, to be inserted into table via SQL
                    let dataArray = [];

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
                    dataArray.push([dateCreated, orderName, salesChannel, isoCurrency, subtotal, discountAmt, shippingAmt, totalTaxesAmt, taxType, total, numItemsOrdered, numFulfillments, numPayments]);
                    });

                    // Insert into table
                    const sql = "INSERT INTO salesData (date_created, order_name, sales_channel, iso_currency, subtotal, discount_amt, shipping_amt, total_taxes_amt, tax_type, total, num_items_ordered, num_fulfillments, num_payments) VALUES ?";

                    connection.query(sql, [dataArray], (error, results, fields) => {
                        if (error) {
                            console.log(error);
                            return res.send(error);
                        }
                    }).on("end", () => {
                        console.log("Inserted given data into salesdata table & released connection.");
                        // Release the connection
                        connection.release();
                        res.redirect("/");
                    })
                } else {

                    // Read the uploaded JSON file
                    const rawData = fs.readFileSync(uploadPath)
                    let json_file = JSON.parse(rawData);

                    // Data array, to be inserted into table via SQL
                    let dataArray = [];

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
                    dataArray.push([dateCreated, orderName, salesChannel, isoCurrency, subtotal, discountAmt, shippingAmt, totalTaxesAmt, taxType, total, numItemsOrdered, numFulfillments, numPayments]);
                    });

                    // Insert into table
                    const sql = "INSERT INTO salesData (date_created, order_name, sales_channel, iso_currency, subtotal, discount_amt, shipping_amt, total_taxes_amt, tax_type, total, num_items_ordered, num_fulfillments, num_payments) VALUES ?";

                    connection.query(sql, [dataArray], (error, results, fields) => {
                        if (error) {
                            console.log(error);
                            return res.send(error);
                        }
                    }).on("end", () => {
                        console.log("Inserted given data into salesdata table & released connection.");
                        // Release the connection
                        connection.release();
                        res.redirect("/salesData");
                    })
                }
            })
        })
    });
});

module.exports = router;