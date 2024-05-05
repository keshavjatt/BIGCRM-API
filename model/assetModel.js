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
});

module.exports = mongoose.model("Asset", assetSchema);