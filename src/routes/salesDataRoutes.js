const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

// Controller
const salesDataController = require("../../controllers/salesDataController");

// Middlewares
router.use(express.urlencoded({
    extended: true
}));
router.use(express.json());
router.use(fileUpload())

// Index
router.get("/", salesDataController.salesData_index);

// Delete the current data
router.post("/delete_original", salesDataController.salesData_delete)

// Re-insert the given/original JSON data
router.post("/insert_original", salesDataController.salesData_insertOriginal);

// Upload a JSON format marketing data file
router.post('/upload', salesDataController.salesData_insertNew);

module.exports = router;