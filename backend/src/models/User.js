const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: String,
  orgId: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" }
});

UserSchema.index({ email: 1, orgId: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);