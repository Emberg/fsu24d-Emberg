const express = require("express");
const ApiKey = require("../models/ApiKey");

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const { generateApiKey, hashApiKey } = require("../utils/apiKey");

const router = express.Router();


// Create API key
router.post("/apikeys", authMiddleware, requireAdmin, async (req, res) => {

  //const { description, expiresInDays } = req.body;
  const { description, expiresAt, rawKey } = req.body;

  //const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  //let expiresAt = null;

  //if (expiresInDays) {
  //  expiresAt = new Date();
  //  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  //}

  const apiKey = await ApiKey.create({
    keyHash,
    orgId: req.user.orgId,
    description,
    expiresAt
  });

  res.json(apiKey);

});


// List keys (no raw key shown)
router.get("/apikeys", authMiddleware, requireAdmin, async (req, res) => {

  const keys = await ApiKey.find(
    { orgId: req.user.orgId },
  );

  res.json(keys);

});

// Update key (editable fields: description, active, expiresAt)
router.put("/apikeys/:id", authMiddleware, requireAdmin, async (req, res) => {
  const { description, active, expiresAt } = req.body;

  const key = await ApiKey.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!key) {
    return res.status(404).json({ message: "API key not found" });
  }

  if (description !== undefined) key.description = description;
  if (active !== undefined) key.active = active;
  if (expiresAt !== undefined) key.expiresAt = expiresAt;

  await key.save();

  res.json(key);
});


// Delete API key
router.delete("/apikeys/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const key = await ApiKey.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });

    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }

    // Delete the key from the database
    await key.deleteOne();

    res.json({ message: "API key deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete API key" });
  }
});

module.exports = router;