const express = require("express");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");

const { buildOrgBookingCache, addBookingToCache, sendEvent, updateBookingInCache, removeBookingFromCache, bookingCache } = require("../services/bookingCacheService");

const { hasOverlap } = require("../services/bookingHelperService");

const router = express.Router();

// Get bookings (expanded recurrence)
router.get("/bookings", authMiddleware, async (req, res) => {
  const orgId = req.user.orgId;

  if (!bookingCache.has(orgId)) {
    await buildOrgBookingCache(orgId);
  }

  res.json(bookingCache.get(orgId));
});

// Create booking
router.post("/bookings", authMiddleware, async (req, res) => {
  const { title, start, end, roomId, recurrence } = req.body;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    await hasOverlap(
      startDate,
      endDate,
      roomId,
      req.user.orgId,
      recurrence
    )
  ) {
    return res.status(400).json({ message: "Room already booked" });
  }

  const booking = await Booking.create({
    userId: req.user.id,
    userEmail: req.user.email,
    roomId,
    orgId: req.user.orgId,
    title,
    start: startDate,
    end: endDate,
    recurrence:
      recurrence?.frequency && recurrence?.repeatUntil
        ? {
            frequency: recurrence.frequency,
            repeatUntil: new Date(recurrence.repeatUntil)
          }
        : null
  });

  addBookingToCache(req.user.orgId, booking);

  //res.json(booking);

  sendEvent(req.user.orgId);
});

// Update booking
router.put("/bookings/:id", authMiddleware, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.orgId !== req.user.orgId) {
    return res.status(403).json({ message: "Forbidden (wrong organisation)" });
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = booking.userId.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: "Not allowed to update this booking" });
  }

  const { title, start, end, roomId, recurrence } = req.body;

  const newStart = new Date(start);
  const newEnd = new Date(end);

  if (!title || !roomId || isNaN(newStart) || isNaN(newEnd)) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  if (
    await hasOverlap(
      newStart,
      newEnd,
      roomId,
      req.user.orgId,
      recurrence,
      booking._id
    )
  ) {
    return res.status(400).json({ message: "Room already booked for this time" });
  }

  //admins can change booking holders
  if (isAdmin && req.body.userId && req.body.userEmail) {
    booking.userId = req.body.userId;
    booking.userEmail = req.body.userEmail;
  }

  booking.title = title;
  booking.start = newStart;
  booking.end = newEnd;
  booking.roomId = roomId;
  booking.recurrence =
    recurrence?.frequency && recurrence?.repeatUntil
      ? {
          frequency: recurrence.frequency,
          repeatUntil: new Date(recurrence.repeatUntil)
        }
      : null;

  await booking.save();

  //MAYBE REMOVE
  //res.json(booking);

  updateBookingInCache(req.user.orgId, booking);

  sendEvent(req.user.orgId);
});

// Delete booking
router.delete("/bookings/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findOne({
    _id: id,
    orgId: req.user.orgId
  });

  if (!booking) {
    return res.status(404).json({
      message: "Booking not found in your organisation"
    });
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = booking.userId.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      message: "You can only delete your own bookings"
    });
  }

  await booking.deleteOne();

  //res.json({ message: "Booking deleted successfully" });

  removeBookingFromCache(req.user.orgId, id);

  sendEvent(req.user.orgId);
});

module.exports = router;