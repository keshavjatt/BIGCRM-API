const express = require("express");
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
router.get("/", getAllTickets);
router.get("/:ticketNo", getSingleTicketByNo);
router.put("/:ticketNo", updateTicketByNo);
router.delete("/:ticketNo", deleteTicketByNo);
router.get("/count/openTicket", getOpenTicketsCount);
router.get("/count/pendingTicket", getPendingTicketsCount);
router.get("/count/ticketsLast15Days", getTicketCountsLast15Days); // New route

module.exports = router;