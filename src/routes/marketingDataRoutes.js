const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

// Controller
const marketingDataController = require("../../controllers/marketingDataController");

// Middlewares
router.use(express.urlencoded({
    extended: true
}));
router.use(express.json());
router.use(fileUpload())

// Index
router.get("/", marketingDataController.marketingData_index);

// Delete the current data
router.post("/delete_original", marketingDataController.marketingData_delete)

// Re-insert the given/original JSON data
router.post("/insert_original", marketingDataController.marketingData_insertOriginal);

// Upload a JSON format marketing data file
router.post('/upload', marketingDataController.marketingData_insertNew);

module.exports = router;