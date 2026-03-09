const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  orgId: { type: String, required: true },
  userEmail: String,
  title: String,
  start: Date,
  end: Date,
  createdAt: { type: Date, default: Date.now },
  recurrence: {
    frequency: { type: String, enum: ["daily", "weekly"] },
    repeatUntil: Date
  }
});

BookingSchema.index({ roomId: 1, orgId: 1 });

module.exports = mongoose.model("Booking", BookingSchema);