const express = require("express");
const router = express.Router();
const { retrieveAnswer, upload, uploadFile } = require("../controllers/ChatbotController");

router.post("/retrieve", retrieveAnswer);
router.post("/upload", upload.single("file"), uploadFile);

module.exports = router;
