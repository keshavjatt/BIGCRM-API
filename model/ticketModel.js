const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  SrNo: { type: Number, required: true },
  TicketNo: { type: String, required: true },
  SiteName: { type: String, required: true },
  LinkId: { type: String, required: true },
  ProblemCode: { type: String, required: true, default: "LINK DOWN" },
  Status: { type: String, required: true, default: "Pending" },
  SrCloser_Timer: { type: String, default: "00:00:00" },
  Up_Timer: { type: String, default: "00:00:00" },
  Down_Timer: { type: String, required: true },
  RFO: { type: String, default: "N/A" },
  AssignedBy: { type: String, default: "N/A" },
  CreatedBy: { type: String, default: "Auto Ticketing System" },
  CreatedDate: { type: Date, default: Date.now },
  LastUpdateBy: { type: String, default: "N/A" },
  LastUpdateDate: { type: Date, default: null },
});

module.exports = mongoose.model("Ticket", ticketSchema);