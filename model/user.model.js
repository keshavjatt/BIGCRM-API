const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNo: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  userRole: {
    type: String,
    enum: ["Admin", "Manager", "Executive"],
    required: true,
  },
  projectName: { type: String, required: true },
  status: { type: String, enum: ["Active", "Block"]},
});

module.exports = mongoose.model("User", userSchema);