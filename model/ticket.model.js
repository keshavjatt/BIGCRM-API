const mongoose = require("mongoose");
const moment = require("moment");

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
  CreatedBy: { type: String, default: "CRM" },
  CreatedDate: { type: String }, 
  LastUpdateBy: { type: String, default: "N/A" },
  LastUpdateDate: { type: String, default: null },
  projectName: { type: String, required: true },
  updates: { type: Array, default: [] },
});

// Pre-save hook to set the CreatedDate before saving
ticketSchema.pre("save", function (next) {
  if (!this.CreatedDate) {
    this.CreatedDate = moment().format("DD-MM-YYYY HH:mm");
  }
  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);