const express = require("express");
const app = express()
const fs = require("fs");
const mysql = require("mysql");

// Environment Variables
const dotenv = require("dotenv");
dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const PORT = process.env.PORT || 3000;

// Parsing Middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Templating engine
app.set("views", "./src/views");
app.set("view engine", "ejs");

// Static Files
app.use(express.static('public'));
app.use("/css", express.static(__dirname + "public/css"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/js", express.static(__dirname + "public/js"))

// Routes
const indexRoute = require("./src/routes/indexRoute");
app.get("/", indexRoute)

// 404 Page
app.get("*", (req, res) => {
    res.render("404")
})

// Read marketing data
let rawdata = fs.readFileSync('./given_files/marketingDataFixed.json');
let json_file = JSON.parse(rawdata);

// Add marketing data to database
const insertIntoDatabase = (json_file) => {
    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    // Loop through the json file and insert each week into the database
    Object.keys(json_file.marketingData).forEach(key => {
        const weekNumber = parseInt(key.split("week")[1]);
        const dateCreated = json_file.marketingData[key].dateCreated;
        const webVisitors = json_file.marketingData[key].webVisitors;
        const prClippings = json_file.marketingData[key].prClippings;
        
        connection.query(`INSERT INTO marketingdata (week_number, date_created, web_visitors, pr_clippings) VALUES ('${weekNumber}', '${dateCreated}', ${webVisitors}, ${prClippings})`, (err, rows, fields) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }
        });
    });
}

// insertIntoDatabase(json_file);

// Listen
app.listen(PORT, (error) => {
    if (error) {
        return console.log("Server error!")
    }

    console.log(`App listening on port ${PORT}`)
})


