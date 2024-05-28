const express = require("express");
const router = express.Router();

const pingProgram = require("../controller/pingController");

// Ping Routes
router.post("/pingandtracert", pingProgram);

module.exports = router;