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
      AssignedBy: req.body.AssignedFor || ticket.AssignedBy, // Set AssignedBy to AssignedFor
    };

    // Push the updated fields to the ticket's updates array
    ticket.updates.push(updateFields);

    // Update the ticket object with the latest values from updateFields
    ticket.ProblemCode = updateFields.ProblemCode;
    ticket.AssignedFor = updateFields.AssignedFor;
    ticket.RFO = updateFields.RFO;
    ticket.Status = updateFields.Status;
    ticket.LastUpdateDate = updateFields.LastUpdateDate;
    ticket.AssignedBy = updateFields.AssignedBy;

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

// Get count of open tickets (excluding CLOSED status)
const getOpenTicketsCount = async (req, res) => {
  try {
    const openTicketsCount = await Ticket.countDocuments({
      Status: { $ne: "Closed" }
    });
    res.json({ openTicketsCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get count of pending tickets (status PENDING)
const getPendingTicketsCount = async (req, res) => {
  try {
    const pendingTicketsCount = await Ticket.countDocuments({ Status: "Pending" });
    res.json({ pendingTicketsCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get ticket count for the last 15 days
const getTicketCountsLast15Days = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const last15Days = Array.from({ length: 15 }, (v, i) => today.clone().subtract(i, 'days').format('DD-MM-YYYY'));

    const ticketCounts = await Ticket.aggregate([
      {
        $match: {
          CreatedDate: {
            $gte: today.clone().subtract(14, 'days').toDate(),
            $lte: today.toDate()
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m-%Y", date: "$CreatedDate" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const countsByDate = last15Days.map(date => {
      const countData = ticketCounts.find(tc => tc._id === date);
      return {
        date,
        count: countData ? countData.count : 0
      };
    });

    res.json(countsByDate);
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
  getOpenTicketsCount,
  getPendingTicketsCount,
  getTicketCountsLast15Days
};