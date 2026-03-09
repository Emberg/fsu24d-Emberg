const express = require("express");
const Translation = require("../models/Translation");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Get locale data
router.get("/locales/:lang", async (req, res) => {
  const { lang } = req.params;
  const translation = await Translation.findOne({ language: lang });

  if (!translation) return res.status(404).json({ message: "Not found" });

  res.json(translation.data);
});

// Admin: update translation
router.put("/locales/:lang", authMiddleware, requireAdmin, async (req, res) => {
  const { orgId } = req.user;
  const { lang } = req.params;
  const { data } = req.body;

  if (!data || typeof data !== "object") {
    return res.status(400).json({ message: "Invalid translation data" });
  }

  try {
    const updated = await Translation.findOneAndUpdate(
      { orgId, language: lang },
      { orgId, language: lang, data },
      { upsert: true, new: true }
    );

    res.json({ message: "Updated successfully", translation: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;