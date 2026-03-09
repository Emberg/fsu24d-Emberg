const Booking = require("../models/Booking");

// Map<orgId, Array<expandedBooking>>
const bookingCache = new Map();

// Map<orgId, Set<response>>
const sseClients = new Map();

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

      currentStart.setDate(
        currentStart.getDate() + (b.recurrence.frequency === "daily" ? 1 : 7)
      );
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

async function buildOrgBookingCache(orgId) {
  const bookings = await Booking.find({ orgId }).populate("roomId", "name");
  const events = [];
  for (const booking of bookings) {
    events.push(...expandBooking(booking));
  }
  bookingCache.set(orgId, events);
}

function addBookingToCache(orgId, booking) {
  if (!bookingCache.has(orgId)) bookingCache.set(orgId, []);
  bookingCache.get(orgId).push(...expandBooking(booking));
}

function removeBookingFromCache(orgId, seriesId) {
  if (!bookingCache.has(orgId)) return;
  const filtered = bookingCache.get(orgId).filter(b => b.seriesId !== seriesId.toString());
  bookingCache.set(orgId, filtered);
}

function updateBookingInCache(orgId, booking) {
  removeBookingFromCache(orgId, booking._id);
  addBookingToCache(orgId, booking);
}

function sendEvent(orgId) {
  const clients = sseClients.get(orgId);
  if (!clients) return;

  const bookings = bookingCache.get(orgId) || [];
  const payload = `data: ${JSON.stringify({ type: "bookings_snapshot", bookings })}\n\n`;

  for (const res of clients) {
    res.write(payload);
  }
}

function registerSSEClient(orgId, res) {
  if (!sseClients.has(orgId)) sseClients.set(orgId, new Set());
  sseClients.get(orgId).add(res);

  // Initial handshake
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  res.on("close", () => {
    sseClients.get(orgId).delete(res);
    if (sseClients.get(orgId).size === 0) {
      sseClients.delete(orgId);
    }
  });
}

// Ping all clients to keep connection alive
setInterval(() => {
  for (const clients of sseClients.values()) {
    for (const res of clients) {
      res.write(": ping\n\n");
    }
  }
}, 25000);

module.exports = {
  bookingCache,
  sseClients,
  expandBooking,
  buildOrgBookingCache,
  addBookingToCache,
  removeBookingFromCache,
  updateBookingInCache,
  sendEvent,
  registerSSEClient
};