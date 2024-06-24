const Ticket = require("../model/ticket.model");
const moment = require("moment");

const getAllTickets = async (req, res) => {
  try {
    let query = {};

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const tickets = await Ticket.find(query); // Filter by query
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getSingleTicketByNo = async (req, res) => {
  try {
    let query = { TicketNo: req.params.ticketNo };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const updateTicketByNo = async (req, res) => {
  try {
    let query = { TicketNo: req.params.ticketNo };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    // Fetch the ticket by TicketNo
    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Get current date and time formatted as 'DD-MM-YYYY HH:mm'
    const currentDateTime = moment().format("DD-MM-YYYY HH:mm");

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

const deleteTicketByNo = async (req, res) => {
  try {
    let query = { TicketNo: req.params.ticketNo };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const ticket = await Ticket.findOneAndDelete(query);

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
    let query = { Status: { $ne: "Closed" } };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const openTicketsCount = await Ticket.countDocuments(query);
    res.json({ openTicketsCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get count of pending tickets (status PENDING)
const getPendingTicketsCount = async (req, res) => {
  try {
    let query = { Status: "Pending" };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const pendingTicketsCount = await Ticket.countDocuments(query);
    res.json({ pendingTicketsCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get ticket counts for the last 15 days
const getTicketsCountByDate = async (req, res) => {
  try {
    const projectName = req.user.projectName;

    // Current date
    const today = moment().startOf("day").toDate();
    // Date 15 days ago
    const fifteenDaysAgo = moment(today).subtract(15, "days").toDate();

    let matchQuery = {
      projectName: projectName,
      CreatedDate: { $gte: fifteenDaysAgo, $lte: today },
    };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      matchQuery.projectName = req.user.projectName;
    }

    const ticketsCountByDate = await Ticket.aggregate([
      {
        $match: matchQuery,
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: { $toDate: "$CreatedDate" },
            },
          },
        },
      },
      {
        $group: {
          _id: "$date",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format the data to include all dates in the range, even those with zero tickets
    const datesArray = [];
    for (let i = 0; i <= 15; i++) {
      datesArray.push(
        moment(fifteenDaysAgo).add(i, "days").format("DD-MM-YYYY")
      );
    }

    const formattedResponse = datesArray.map((date) => {
      const ticketData = ticketsCountByDate.find(
        (ticket) => ticket._id === date
      );
      return { date, count: ticketData ? ticketData.count : 0 };
    });

    res.json(formattedResponse);
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
  getTicketsCountByDate,
};