const express = require("express");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Get rooms
router.get("/rooms", authMiddleware, async (req, res) => {
  const rooms = await Room.find({ orgId: req.user.orgId });
  res.json(rooms);
});

// Create room (Admin only)
router.post("/rooms", authMiddleware, requireAdmin, async (req, res) => {
  const { name, capacity } = req.body;

  try {
    const room = await Room.create({
      name,
      capacity,
      orgId: req.user.orgId
    });
    res.json(room);
  } catch {
    res.status(400).json({ message: "Room already exists" });
  }
});

router.delete("/rooms/:id", authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const room = await Room.findOne({ _id: id, orgId: req.user.orgId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    await room.deleteOne();
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete room", error: err.message });
  }
});

module.exports = router;