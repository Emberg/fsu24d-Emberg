const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Get all users (Admin only)
router.get("/:orgId/users", authMiddleware, requireAdmin, async (req, res) => {
  const { orgId } = req.params;

  if (orgId !== req.user.orgId) {
    return res.status(403).json({ message: "Forbidden (wrong organisation)" });
  }

  try {
    const users = await User.find({ orgId }, { password: 0 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;