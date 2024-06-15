const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  getAllTickets,
  getSingleTicketByNo,
  updateTicketByNo,
  deleteTicketByNo,
  getOpenTicketsCount,
  getPendingTicketsCount,
  getTicketsCountByDate,
} = require("../controller/ticket.controller");

const router = express.Router();

// Ticket Routes
router.get("/", auth, getAllTickets);
router.get("/:ticketNo", auth, getSingleTicketByNo);
router.put("/:ticketNo", auth, updateTicketByNo);
router.delete("/:ticketNo", auth, deleteTicketByNo);
router.get("/count/openTicket", auth, getOpenTicketsCount);
router.get("/count/pendingTicket", auth, getPendingTicketsCount);
router.get("/ticketsCountByDate", auth, getTicketsCountByDate);

module.exports = router;