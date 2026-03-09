const express = require("express");
const Organisation = require("../models/Organisation");

const router = express.Router();

// List all organisations
router.get("/organisations", async (req, res) => {
  try {
    const orgs = await Organisation.find({}, { _id: 0, orgId: 1, orgName: 1 });
    res.json(orgs);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;