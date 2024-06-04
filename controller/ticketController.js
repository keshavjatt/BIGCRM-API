const Ticket = require("../model/ticketModel");
const moment = require("moment");

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
    // Fetch the ticket by TicketNo
    const ticket = await Ticket.findOne({ TicketNo: req.params.ticketNo });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Get current date and time formatted as 'DD-MM-YYYY hh:mm A'
    const currentDateTime = moment().format("DD-MM-YYYY hh:mm A");

    // Define the fields to be updated including current date and time
    const updateFields = {
      ProblemCode: req.body.ProblemCode || ticket.ProblemCode,
      AssignedFor: req.body.AssignedFor || ticket.AssignedFor,
      RFO: req.body.RFO || ticket.RFO,
      Status: req.body.Status || ticket.Status,
      ResolutionUpdate: req.body.ResolutionUpdate || ticket.ResolutionUpdate,
      LastUpdateDate: currentDateTime, // Include current date and time
    };

    // Push the updated fields to the ticket's updates array
    ticket.updates.push(updateFields);

    // Save the updated ticket
    await ticket.save();

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