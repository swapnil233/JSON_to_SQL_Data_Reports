const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

// Controller
const productsDataController = require("../../controllers/productsDataController");

// Middlewares
router.use(express.urlencoded({
    extended: true
}));
router.use(express.json());
router.use(fileUpload())

// Index
router.get("/", productsDataController.productsData_index);

// Delete the current data
router.post("/delete_original", productsDataController.productsData_delete)

// Re-insert the given/original JSON data
router.post("/insert_original", productsDataController.productsData_insertOriginal);

// Upload a JSON format products data file
router.post('/upload', productsDataController.productsData_insertNew);

module.exports = router;