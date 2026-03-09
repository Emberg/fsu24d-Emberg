const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Organisation = require("../models/Organisation");

const router = express.Router();
const JWT_SECRET = "devsecret";

// Register
router.post("/register", async (req, res) => {
  const { email, password, orgId } = req.body;

  const org = await Organisation.findOne({ orgId });
  if (!org) return res.status(400).json({ message: "Invalid organisation" });

  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      email,
      password: hashed,
      orgId,
      role: "user"
    });
    res.json(user);
  } catch {
    res.status(400).json({ message: "User exists" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password, orgId } = req.body;

  const user = await User.findOne({ email, orgId });
  if (!user) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, email: user.email, orgId: user.orgId, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

module.exports = router;