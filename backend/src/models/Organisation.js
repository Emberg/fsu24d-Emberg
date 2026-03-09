const mongoose = require("mongoose");

const OrganisationSchema = new mongoose.Schema({
  orgId: { type: String, required: true, unique: true },
  orgName: { type: String, required: true }
});

module.exports = mongoose.model("Organisation", OrganisationSchema);