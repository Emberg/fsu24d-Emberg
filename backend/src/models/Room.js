const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: Number,
  orgId: { type: String, required: true }
});

RoomSchema.index({ name: 1, orgId: 1 }, { unique: true });

module.exports = mongoose.model("Room", RoomSchema);