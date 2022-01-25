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
    multipleStatements: true,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME
});

// Index Route
const productsData_index = (req, res) => {
    pool.getConnection((err, connection) => {

        const query = `
        Select 
        product.product_name as sku, 
        product.barcode, 
        product.parent_sku, 
        product.region_code, 
        product.item_type, 
        product.supplier, 
        product.brand,
        product.variant_name, 
        product.short_description,
        pack_data.pack_type, 
        components.component_name, 	
        components.amount, 
        metric.lmm,
        metric.wmm,
        metric.hmm,
        metric.gwg,
        metric.nwg,
        metric.cbm,
        imperial.lin,
        imperial.win,
        imperial.hin,
        imperial.gwlb,
        imperial.nwlb,
        imperial.cbft, 
        price_data.buy_bomUSD,
        price_data.buy_canadaUSD,
        price_data.buy_franceUSD,
        price_data.buy_hongkongUSD,
        price_data.sell_CAD,
        price_data.sell_USD,
        price_data.sell_GBP,
        price_data.sell_EUR,
        price_data.sell_AUD,
        price_data.sell_NZD,
        price_data.sell_SGD,
        price_data.sell_HKD

        FROM product 
        LEFT JOIN pack_data ON product.product_id = pack_data.product_id
        LEFT JOIN components ON product.product_id = components.product_id 
        LEFT JOIN metric ON metric.metric_id = product.product_id 
        LEFT JOIN imperial ON imperial.imperial_id = product.product_id 
        LEFT JOIN price_data ON price_data.price_data_id = product.product_id
        `

        connection.query(query, (err, rows, fields) => {
            if (err) {
                connection.release();

                console.log(err);
                res.send(err);
            } else {
                connection.release();
                res.render("productsData", {
                    title: "Products Data",
                    productsData: rows
                });
            }
        });
    });
};

// Deleting data
const productsData_delete = (req, res) => {
    pool.getConnection((err, connection) => {
        connection.query('SELECT * FROM product', (err, rows, fields) => {
            if (err) {
                console.log(err)
                return res.send(err);
            }

            // If product table has data in it, delete it and insert new data.
            if (rows.length > 0) {
                console.log("There is already data in the database. Deleting it now...");

                // Delete all the data in productsData table
                connection.query(`
                SET foreign_key_checks = 0;
                DELETE FROM product;`);

                connection.query(`CREATE TABLE product (product_id INT PRIMARY KEY AUTO_INCREMENT, product_name VARCHAR(255), barcode VARCHAR(255) NOT NULL, parent_sku VARCHAR(255), region_code INT NOT NULL, item_type VARCHAR(40) NOT NULL, supplier VARCHAR(40) NOT NULL, brand VARCHAR(40) NOT NULL, pack_data INT, price_data INT, variant_name VARCHAR(255) NOT NULL, short_description TEXT NOT NULL, stock_link VARCHAR(255) NOT NULL, last_updated DATE);`);

                connection.query(`CREATE TABLE pack_data(pack_id INT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, pack_type VARCHAR(40), components_id INT, metric_id INT, imperial_id INT, FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE);`);

                connection.query(`ALTER TABLE product ADD FOREIGN KEY (pack_data) REFERENCES pack_data(pack_id) ON DELETE CASCADE;`)

                connection.query("DROP TABLE IF EXISTS components;")

                connection.query(`CREATE TABLE components(components_id INT PRIMARY KEY AUTO_INCREMENT, product_id INT, component_name VARCHAR(50) NOT NULL, amount INT NOT NULL, FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE);`);

                connection.query(`ALTER TABLE pack_data ADD FOREIGN KEY (components_id) REFERENCES components(components_id) ON DELETE CASCADE;`);

                connection.query(`DROP TABLE IF EXISTS metric;`)

                connection.query(`CREATE TABLE metric(metric_id INT PRIMARY KEY AUTO_INCREMENT, lmm FLOAT, wmm FLOAT, hmm FLOAT, gwg FLOAT, nwg FLOAT, cbm FLOAT);`)

                connection.query(`ALTER TABLE pack_data
                ADD FOREIGN KEY (metric_id)
                REFERENCES metric(metric_id)
                ON DELETE CASCADE;`)

                connection.query(`DROP TABLE IF EXISTS imperial;`)

                connection.query(`CREATE TABLE imperial(
                    imperial_id INT PRIMARY KEY AUTO_INCREMENT,
                    lin FLOAT,
                    win FLOAT,
                    hin FLOAT,
                    gwlb FLOAT,
                    nwlb FLOAT,
                    cbft FLOAT
                );`);

                connection.query(`ALTER TABLE pack_data
                ADD FOREIGN KEY (imperial_id)
                REFERENCES imperial(imperial_id)
                ON DELETE CASCADE;`)

                connection.query(`DROP TABLE IF EXISTS price_data;`)

                connection.query(`CREATE TABLE price_data (
                    price_data_id INT PRIMARY KEY AUTO_INCREMENT,
                    buy_bomUSD INT DEFAULT NULL,
                    buy_canadaUSD FLOAT DEFAULT NULL,
                    buy_franceUSD FLOAT DEFAULT NULL,
                    buy_hongkongUSD FLOAT DEFAULT NULL,
                    sell_CAD FLOAT DEFAULT NULL,
                    sell_USD FLOAT DEFAULT NULL,
                    sell_GBP FLOAT DEFAULT NULL,
                    sell_EUR FLOAT DEFAULT NULL,
                    sell_AUD FLOAT DEFAULT NULL,
                    sell_NZD FLOAT DEFAULT NULL,
                    sell_SGD FLOAT DEFAULT NULL,
                    sell_HKD FLOAT DEFAULT NULL
                );`)

                connection.query(`ALTER TABLE product
                ADD FOREIGN KEY (price_data) 
                REFERENCES price_data(price_data_id) 
                ON DELETE CASCADE;`)

                res.redirect("/productsData");

                // If the productsData table is already empty
            } else {
                res.send("Data is already empty");
            }
        })

    });
}

// Insert original/given marketing data
const productsData_insertOriginal = (req, res) => {
    // Read the given JSON file
    const rawData = fs.readFileSync('./given_files/productGridFixed.json');
    let json_file = JSON.parse(rawData);

    pool.getConnection((err, connection) => {
        connection.query('SELECT * FROM product', (err, rows, fields) => {
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

const productsData_insertNew = (req, res) => {
    // If no file uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send("No files uploaded")
    }

    // If the uploaded file is not a JSON file
    if (req.files.productsDataJSON.mimetype !== "application/json") {
        res.status(400).send("You can only upload JSON files.")
    }

    // If the uploaded JSON file is greater 4mb (the max json file size)
    if (req.files.productsDataJSON.size > 4000000) {
        res.status(400).send("The JSON file needs to be less than 4mb.")
    }

    // Check if the JSON is valid
    try {
        JSON.parse(req.files.productsDataJSON.data);
        console.log("Parsed successfully. Valid JSON file.")
    } catch (error) {
        return res.send("Invalid JSON! Please go back and upload a valid JSON file.")
    }

    // The uploaded file
    const uploadedJSONFile = req.files.productsDataJSON;

    // Parse the uploaded JSON file
    const rawData = uploadedJSONFile.data;
    let json_file = JSON.parse(rawData);

    if (json_file.productSKU) {
        console.log("Correctly formatted marketing data file")
    } else {
        return res.send("Only products data files are accepted. Please go back and upload a valid JSON file.")
    }

    // Once all validation is done, insert the data
    pool.getConnection((err, connection) => {
        if (err) {
            console.log(err)
            return res.send(err);
        }

        connection.query('SELECT * FROM product', (err, rows, fields) => {
            if (err) {
                console.log(err)
                return res.send(err);
            }

            // If product table has data in it, delete it and insert new data.
            if (rows.length > 0) {
                console.log("There is already data in the database. Deleting it now...");

                // Delete all the data in productsData table
                connection.query(`
                SET foreign_key_checks = 0;
                DELETE FROM product;`);

                connection.query(`CREATE TABLE product (product_id INT PRIMARY KEY AUTO_INCREMENT, product_name VARCHAR(255), barcode VARCHAR(255) NOT NULL, parent_sku VARCHAR(255), region_code INT NOT NULL, item_type VARCHAR(40) NOT NULL, supplier VARCHAR(40) NOT NULL, brand VARCHAR(40) NOT NULL, pack_data INT, price_data INT, variant_name VARCHAR(255) NOT NULL, short_description TEXT NOT NULL, stock_link VARCHAR(255) NOT NULL, last_updated DATE);`);

                connection.query(`CREATE TABLE pack_data(pack_id INT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, pack_type VARCHAR(40), components_id INT, metric_id INT, imperial_id INT, FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE);`);

                connection.query(`ALTER TABLE product ADD FOREIGN KEY (pack_data) REFERENCES pack_data(pack_id) ON DELETE CASCADE;`)

                connection.query("DROP TABLE IF EXISTS components;")

                connection.query(`CREATE TABLE components(components_id INT PRIMARY KEY AUTO_INCREMENT, product_id INT, component_name VARCHAR(50) NOT NULL, amount INT NOT NULL, FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE);`);

                connection.query(`ALTER TABLE pack_data ADD FOREIGN KEY (components_id) REFERENCES components(components_id) ON DELETE CASCADE;`);

                connection.query(`DROP TABLE IF EXISTS metric;`)

                connection.query(`CREATE TABLE metric(metric_id INT PRIMARY KEY AUTO_INCREMENT, lmm FLOAT, wmm FLOAT, hmm FLOAT, gwg FLOAT, nwg FLOAT, cbm FLOAT);`)

                connection.query(`ALTER TABLE pack_data
                ADD FOREIGN KEY (metric_id)
                REFERENCES metric(metric_id)
                ON DELETE CASCADE;`)

                connection.query(`DROP TABLE IF EXISTS imperial;`)

                connection.query(`CREATE TABLE imperial(
                    imperial_id INT PRIMARY KEY AUTO_INCREMENT,
                    lin FLOAT,
                    win FLOAT,
                    hin FLOAT,
                    gwlb FLOAT,
                    nwlb FLOAT,
                    cbft FLOAT
                );`);

                connection.query(`ALTER TABLE pack_data
                ADD FOREIGN KEY (imperial_id)
                REFERENCES imperial(imperial_id)
                ON DELETE CASCADE;`)

                connection.query(`DROP TABLE IF EXISTS price_data;`)

                connection.query(`CREATE TABLE price_data (
                    price_data_id INT PRIMARY KEY AUTO_INCREMENT,
                    buy_bomUSD INT DEFAULT NULL,
                    buy_canadaUSD FLOAT DEFAULT NULL,
                    buy_franceUSD FLOAT DEFAULT NULL,
                    buy_hongkongUSD FLOAT DEFAULT NULL,
                    sell_CAD FLOAT DEFAULT NULL,
                    sell_USD FLOAT DEFAULT NULL,
                    sell_GBP FLOAT DEFAULT NULL,
                    sell_EUR FLOAT DEFAULT NULL,
                    sell_AUD FLOAT DEFAULT NULL,
                    sell_NZD FLOAT DEFAULT NULL,
                    sell_SGD FLOAT DEFAULT NULL,
                    sell_HKD FLOAT DEFAULT NULL
                );`)

                connection.query(`ALTER TABLE product
                ADD FOREIGN KEY (price_data) 
                REFERENCES price_data(price_data_id) 
                ON DELETE CASCADE;`)

                insertData(req, res, json_file, connection);

                // If the productsData table is already empty
            } else {
                insertData(req, res, json_file, connection)
            }
        })
    })
}

const insertData = (req, res, json_file, connection) => {

    Object.keys(json_file.productSKU).forEach(product => {
        const product_name = product;
        const barcode = json_file.productSKU[product].barcode;

        let parent_sku = null;
        if (json_file.productSKU[product].parentSku !== "") {
            parent_sku = json_file.productSKU[product].parentSku;
        }

        const region_code = json_file.productSKU[product].regionCode;
        const item_type = json_file.productSKU[product].itemType;
        const supplier = json_file.productSKU[product].supplier;
        const brand = json_file.productSKU[product].brand;

        const variant_name = json_file.productSKU[product].variantName;
        const short_description = json_file.productSKU[product].shortDesc;
        const stock_link = json_file.productSKU[product].stocklink;
        const last_updated = json_file.productSKU[product].lastUpdated;

        // Insert product data
        const insert_product = `INSERT INTO product VALUES (
            NULL, -- auto incremented id
            "${product_name}", -- product_name
            "${barcode}", -- barcode
            "${parent_sku}", -- parent_sku
            ${region_code}, -- region_code
            "${item_type}", -- item_type
            "${supplier}", -- supplier
            "${brand}", -- brand
            NULL, -- pack_data
            NULL, -- price_data
            "${variant_name}", -- variant_name
            "${short_description}", -- short_description
            "${stock_link}", -- stock_link
            "${last_updated}" -- last_updated
        )`;

        connection.query(insert_product, (err, result) => {
            if (err) {
                res.send(err);
            }
        });

        // Insert pack data
        const insert_pack_data = `INSERT INTO pack_data VALUES (
            NULL, -- pack_id
            LAST_INSERT_ID(), -- product_id
            "${json_file.productSKU[product].packData.packType}", -- pack_type
            NULL, -- components_id FOREIGN KEY
            NULL, -- metric_id FOREIGN KEY
            NULL -- imperial_id FOREIGN KEY
        )`;

        connection.query(insert_pack_data, (err, result) => {
            if (err) {
                res.send(err);
            }
        });

        // Update the product table to include the pack_id
        const update_product = `UPDATE product SET pack_data = LAST_INSERT_ID() WHERE product_id = LAST_INSERT_ID()`;
        connection.query(update_product, (err, result) => {
            if (err) {
                res.send(err);
            }
        });

        // Insert components data
        const components_array = json_file.productSKU[product].packData.components;
        components_array.forEach(component => {
            const component_name = component.split("::")[0];
            const component_quantity = parseInt(component.split("::")[1])

            const insert_components = `INSERT INTO components VALUES (
                NULL, -- components_id
                LAST_INSERT_ID(), -- product_id
                "${component_name}", -- component_name
                ${component_quantity} -- component_quantity
            )`;

            connection.query(insert_components, (err, result) => {
                if (err) {
                    res.send(err);
                }
            });
        })

        connection.query("UPDATE pack_data SET components_id = LAST_INSERT_ID() WHERE pack_id = LAST_INSERT_ID();", (err, result) => {
            if (err) {
                res.send(err);
            }
        });

        // Insert metric data
        const insert_metric = `INSERT INTO metric VALUES (
            NULL, -- metric_id
            ${json_file.productSKU[product].packData.Metric.LMM}, -- LMM
            ${json_file.productSKU[product].packData.Metric.WMM}, -- WMM
            ${json_file.productSKU[product].packData.Metric.HMM}, -- HMM
            ${json_file.productSKU[product].packData.Metric.GWG}, -- GWG
            ${json_file.productSKU[product].packData.Metric.NWG}, -- NWG
            ${json_file.productSKU[product].packData.Metric.CBM} -- CBM
        )`;

        // Execute the query
        connection.query(insert_metric, (err, result) => {
            if (err) {
                console.log(err);
            }
        });

        // Update the pack_data table
        const update_pack_data_metric = `UPDATE pack_data SET metric_id = LAST_INSERT_ID() WHERE pack_id = LAST_INSERT_ID()`;

        // Execute the query
        connection.query(update_pack_data_metric, (err, result) => {
            if (err) {
                console.log(err);
            }
        });

        // Query to insert imperial
        const insert_imperial = `INSERT INTO imperial VALUES (
            NULL, -- imperial_id
            ${json_file.productSKU[product].packData.Imperial.LIN}, -- LIN
            ${json_file.productSKU[product].packData.Imperial.WIN}, -- WIN
            ${json_file.productSKU[product].packData.Imperial.HIN}, -- HIN
            ${json_file.productSKU[product].packData.Imperial.GWLB}, -- GWLB
            ${json_file.productSKU[product].packData.Imperial.NWLB}, -- NWLB
            ${json_file.productSKU[product].packData.Imperial.CBFT} -- CBFT
        )`;

        // Execute the query
        connection.query(insert_imperial, (err, result) => {
            if (err) {
                console.log(err);
            }
        });

        // Update the pack_data table
        const update_pack_data_imperial = `UPDATE pack_data SET imperial_id = LAST_INSERT_ID() WHERE pack_id = LAST_INSERT_ID()`;

        // Execute the query
        connection.query(update_pack_data_imperial, (err, result) => {
            if (err) {
                console.log(err);
            }
        });

        // Query to insert price_data
        const possibleSellRegions = ["CAD", "USD", "GBP", "EUR", "AUD", "NZD", "SGD", "HKD"];

        possibleSellRegions.forEach(region => {
            if (json_file.productSKU[product].priceData.Sell[region] === undefined) {
                json_file.productSKU[product].priceData.Sell[region] = null;
            }
        });

        const insert_price_data = `INSERT INTO price_data VALUES (
            NULL, -- price_data_id
            ${json_file.productSKU[product].priceData.Buy.BOMUSD}, -- buy_bomUSD
            ${json_file.productSKU[product].priceData.Buy.buyCanadaUSD}, -- buy_canadaUSD
            ${json_file.productSKU[product].priceData.Buy.buyFranceUSD}, -- buy_franceUSD
            ${json_file.productSKU[product].priceData.Buy.buyHongKongUSD}, -- buy_hongkongUSD
            ${(json_file.productSKU[product].priceData.Sell.CAD)!==undefined ? json_file.productSKU[product].priceData.Sell.CAD : null}, -- sell_CAD
            ${(json_file.productSKU[product].priceData.Sell.USD)!==undefined ? json_file.productSKU[product].priceData.Sell.USD : null}, -- sell_USD
            ${(json_file.productSKU[product].priceData.Sell.GBP)!==undefined ? json_file.productSKU[product].priceData.Sell.GBP : null}, -- sell_GBP
            ${(json_file.productSKU[product].priceData.Sell.EUR)!==undefined ? json_file.productSKU[product].priceData.Sell.EUR : null}, -- sell_EUR
            ${(json_file.productSKU[product].priceData.Sell.AUD)!==undefined ? json_file.productSKU[product].priceData.Sell.AUD : null}, -- sell_AUD
            ${(json_file.productSKU[product].priceData.Sell.NZD)!==undefined ? json_file.productSKU[product].priceData.Sell.NZD : null}, -- sell_NZD
            ${(json_file.productSKU[product].priceData.Sell.SGD)!==undefined ? json_file.productSKU[product].priceData.Sell.SGD : null}, -- sell_SGD
            ${(json_file.productSKU[product].priceData.Sell.HKD)!==undefined ? json_file.productSKU[product].priceData.Sell.HKD : null} -- sell_HKD
        )`;

        // Insert price_data
        connection.query(insert_price_data, (err, result) => {
            if (err) {
                console.log(err);
            }
        });

        // Update the product table
        const update_product_price_data = `UPDATE product SET price_data = LAST_INSERT_ID() WHERE product_id = LAST_INSERT_ID()`;
        connection.query(update_product_price_data, (err, result) => {
            if (err) {
                console.log(err);
            }
        });
    })

    res.redirect("/");
}

module.exports = {
    productsData_index,
    productsData_delete,
    productsData_insertOriginal,
    productsData_insertNew
};