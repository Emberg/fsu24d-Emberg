const Booking = require("../models/Booking");

// Check overlap
async function hasOverlap(start, end, roomId, orgId, recurrence = null, excludeBookingId = null) {
  const query = { roomId, orgId };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const existingBookings = await Booking.find(query);

  const newOccurrences = [];

  if (recurrence?.frequency && recurrence?.repeatUntil) {
    let currentStart = new Date(start);
    const repeatUntil = new Date(recurrence.repeatUntil);
    repeatUntil.setHours(23, 59, 59, 999);

    while (currentStart <= repeatUntil) {
      newOccurrences.push({ start: new Date(currentStart), end: new Date(currentStart.getTime() + (end - start)) });
      currentStart.setDate(currentStart.getDate() + (recurrence.frequency === "daily" ? 1 : 7));
    }
  } else newOccurrences.push({ start, end });

  for (const existing of existingBookings) {
    const existingOccurrences = [];
    if (existing.recurrence?.frequency && existing.recurrence?.repeatUntil) {
      let currentStart = new Date(existing.start);
      const repeatUntil = new Date(existing.recurrence.repeatUntil);
      repeatUntil.setHours(23, 59, 59, 999);

      while (currentStart <= repeatUntil) {
        existingOccurrences.push({ start: new Date(currentStart), end: new Date(currentStart.getTime() + (existing.end - existing.start)) });
        currentStart.setDate(currentStart.getDate() + (existing.recurrence.frequency === "daily" ? 1 : 7));
      }
    } else existingOccurrences.push({ start: existing.start, end: existing.end });

    for (const newOcc of newOccurrences) {
      for (const existOcc of existingOccurrences) {
        if (newOcc.start < existOcc.end && newOcc.end > existOcc.start) return true;
      }
    }
  }

  return false;
}

// Expand recurrence into individual events
function expandBooking(b) {
  const events = [];
  if (b.recurrence?.frequency && b.recurrence?.repeatUntil) {
    let currentStart = new Date(b.start);
    const duration = b.end.getTime() - b.start.getTime();
    const repeatUntil = new Date(b.recurrence.repeatUntil);
    repeatUntil.setHours(23, 59, 59, 999);

    while (currentStart <= repeatUntil) {
      events.push({
        _id: `${b._id}-${currentStart.toISOString()}`,
        seriesId: b._id.toString(),
        userEmail: b.userEmail,
        title: b.title,
        start: new Date(currentStart),
        end: new Date(currentStart.getTime() + duration),
        roomId: b.roomId,
        recurrence: b.recurrence,
        recurrenceStart: new Date(b.start)
      });
      currentStart.setDate(currentStart.getDate() + (b.recurrence.frequency === "daily" ? 1 : 7));
    }
  } else {
    events.push({
      _id: b._id.toString(),
      seriesId: b._id.toString(),
      userEmail: b.userEmail,
      title: b.title,
      start: b.start,
      end: b.end,
      roomId: b.roomId
    });
  }
  return events;
}

module.exports = {
  hasOverlap,
  expandBooking
};