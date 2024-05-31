const Ticket = require("../model/ticketModel");

// Get all tickets
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get a single ticket by TicketNo
const getSingleTicketByNo = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ TicketNo: req.params.ticketNo });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update a ticket by TicketNo
const updateTicketByNo = async (req, res) => {
  try {
    // Define the fields that can be updated
    const allowedUpdates = [
      "ProblemCode",
      "Status",
      "RFO",
      "AssignedBy",
      "CreatedBy",
      "LastUpdateBy",
      "LastUpdateDate",
    ];

    // Create an update object with only the allowed fields
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Find the ticket by TicketNo and update the allowed fields
    const ticket = await Ticket.findOneAndUpdate(
      { TicketNo: req.params.ticketNo },
      { $set: updates },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Ticket successfully updated", ticket });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete a ticket by TicketNo
const deleteTicketByNo = async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndDelete({
      TicketNo: req.params.ticketNo,
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Ticket successfully deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAllTickets,
  getSingleTicketByNo,
  updateTicketByNo,
  deleteTicketByNo,
};