const express = require("express");
const router = express.Router();

const Room = require("../models/Room");
const Organisation = require("../models/Organisation");

const apiKeyAuth = require("../middleware/apiKeyAuth");

const {
  buildOrgBookingCache,
  bookingCache
} = require("../services/bookingCacheService");

router.get("/rooms", apiKeyAuth, async (req, res) => {

  const rooms = await Room.find(
    { orgId: req.orgId },
    { name: 1, capacity: 1 }
  );

  res.json(rooms);
});

router.get("/bookings", apiKeyAuth, async (req, res) => {

  const orgId = req.orgId;

  if (!bookingCache.has(orgId)) {
    await buildOrgBookingCache(orgId);
  }

  res.json(bookingCache.get(orgId));
});

router.get("/organisation", apiKeyAuth, async (req, res) => {

  const org = await Organisation.findOne(
    { orgId: req.orgId },
    { _id: 0, orgId: 1, orgName: 1 }
  );

  res.json(org);
});

module.exports = router;