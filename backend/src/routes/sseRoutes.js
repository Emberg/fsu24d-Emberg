const express = require("express");
const jwt = require("jsonwebtoken");
const { registerSSEClient } = require("../services/bookingCacheService");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

router.get("/events", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).end();
  }

  const orgId = decoded.orgId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  registerSSEClient(orgId, res);
});

module.exports = router;