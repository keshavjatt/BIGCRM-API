const express = require("express");
const {
  getAllTickets,
  getSingleTicketByNo,
  updateTicketByNo,
  deleteTicketByNo,
} = require("../controller/ticketController");

const router = express.Router();

// Ticket Routes
router.get("/", getAllTickets);
router.get("/:ticketNo", getSingleTicketByNo);
router.put("/:ticketNo", updateTicketByNo);
router.delete("/:ticketNo", deleteTicketByNo);

module.exports = router;