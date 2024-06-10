const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  linkId: { type: String, required: true, unique: true },
  siteName: { type: String, required: true },
  address: { type: String, required: true },
  modelMake: { type: String, required: true },
  serialNo: { type: String, required: true },
  ipAddress1: { type: String, required: true },
  ipAddress2: { type: String, required: true },
  connectivity: { type: String, required: true },
  linkBW: { type: String, required: true },
  discoveryDate: { type: String, required: true },
  emailId: { type: String, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  lastDownTime: { type: Date, default: null },
  firstDownTime: { type: Date, default: null },
  projectName: { type: String, required: true }, // New field added
});

assetSchema.statics.updateStatus = async function (linkId, newStatus) {
  try {
    return await this.findOneAndUpdate(
      { linkId },
      { status: newStatus },
      { new: true }
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = mongoose.model("Asset", assetSchema);