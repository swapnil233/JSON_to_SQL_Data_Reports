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

module.exports = router;