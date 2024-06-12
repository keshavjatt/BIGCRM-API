const express = require("express");
const auth = require("../middleware/auth");
const {
  getAllTickets,
  getSingleTicketByNo,
  updateTicketByNo,
  deleteTicketByNo,
  getOpenTicketsCount,
  getPendingTicketsCount,
  getTicketCountsLast15Days
} = require("../controller/ticketController");

const router = express.Router();

// Ticket Routes
router.get("/", auth, getAllTickets);
router.get("/:ticketNo", auth, getSingleTicketByNo);
router.put("/:ticketNo", auth, updateTicketByNo);
router.delete("/:ticketNo", auth, deleteTicketByNo);
router.get("/count/openTicket", auth, getOpenTicketsCount);
router.get("/count/pendingTicket", auth, getPendingTicketsCount);
router.get("/count/ticketsLast15Days", getTicketCountsLast15Days); // New route

module.exports = router;