import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import BookingModal from "../components/BookingModal.jsx";
import BookingEditModal from "../components/BookingEditModal.jsx";
import { useRef } from "react";
import { useLocale } from "../context/LocaleContext";
import Header from "../components/Header.jsx";
//import { useMemo } from 'react';

const API = process.env.API;
const ROOM_COLORS = ["#1E90FF", "#32CD32", "#FF8C00", "#FF1493", "#8A2BE2"];

// Utility to decode JWT safely
function getTokenData() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export default function Calendar() {
  // "calendar" | "table"
  const [viewMode, setViewMode] = useState("calendar"); 
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ghostHorizonDays, setGhostHorizonDays] = useState(30);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userEmail = getTokenData().email; // Get email from JWT payload
  const calendarRef = useRef(null);
  const { t, locale, changeLanguage } = useLocale();

  // Map rooms for FullCalendar resources
  const resources = rooms.map(room => ({ id: room._id, title: room.name }));

  // Load rooms
  useEffect(() => {
    if (!token) return navigate("/");
    fetchRooms();
  }, [token]);

  // Load bookings after rooms are loaded
  useEffect(() => {
    if (token && rooms.length) fetchBookings();
  }, [token, rooms]);

  useEffect(() => {
    fetchBookings(currentDate);
  }, [ghostHorizonDays, currentDate]);

  //SSE EVENTS
  useEffect(() => {
    if (!token || rooms.length === 0) return;
  
    const eventSource = new EventSource(`${API}/events?token=${token}`);
  
    eventSource.onmessage = (event) => {
      if (!event.data || event.data == '{"type":"connected"}') return;

      try {
        const data = JSON.parse(event.data);
  
        applyBookingsSnapshot(data.bookings);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };
  
    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
    };
  
    return () => {
      eventSource.close();
    };
  }, [token, rooms]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(t("errors.fetchRooms"));
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
      alert(t("errors.loadRooms"));
      navigate("/");
    }
  };

  const applyBookingsSnapshot = (data) => {
    const colorMap = {};
    rooms.forEach((room, i) => {
      colorMap[room._id] = ROOM_COLORS[i % ROOM_COLORS.length];
    });
  
    const referenceDateOnly = new Date(currentDate);
    referenceDateOnly.setHours(0, 0, 0, 0);
    const referenceDayIndex = currentDate.getDay();
  
    const horizonDate = new Date(referenceDateOnly);
    horizonDate.setDate(horizonDate.getDate() + ghostHorizonDays);
    horizonDate.setHours(23, 59, 59, 999);
  
    const formattedEvents = [];
    const ghostEvents = [];
    const addedSeries = new Set();
  
    data.forEach(b => {
      const start = new Date(b.start);
      const end = new Date(b.end);
      const duration = end - start;
  
      const event = {
        id: b._id,
        title: b.title,
        start: start.toISOString(),
        end: end.toISOString(),
        resourceId: b.roomId?._id || b.roomId,
        backgroundColor: colorMap[b.roomId?._id || b.roomId] || "#808080",
        borderColor: colorMap[b.roomId?._id || b.roomId] || "#808080",
        recurrence: b.recurrence || null,
        recurrenceStart: b.recurrenceStart || null,
        seriesId: b.seriesId || b._id,
        userEmail: b.userEmail
      };
  
      formattedEvents.push(event);
  
      if (addedSeries.has(event.seriesId)) return;
  
      if (event.recurrence?.frequency && event.recurrence.repeatUntil) {
  
        const recurrenceStartDate = new Date(event.recurrenceStart);
        recurrenceStartDate.setHours(0, 0, 0, 0);
  
        if (recurrenceStartDate <= referenceDateOnly) return;
  
        const repeatUntil = new Date(event.recurrence.repeatUntil);
        repeatUntil.setHours(23, 59, 59, 999);
  
        let occurrenceStart = new Date(start);
  
        while (occurrenceStart <= repeatUntil && occurrenceStart <= horizonDate) {
  
          if (
            occurrenceStart > referenceDateOnly &&
            occurrenceStart.getDay() === referenceDayIndex
          ) {
  
            const ghostStart = new Date(referenceDateOnly);
            ghostStart.setHours(
              occurrenceStart.getHours(),
              occurrenceStart.getMinutes()
            );
  
            const ghostEnd = new Date(ghostStart.getTime() + duration);
  
            ghostEvents.push({
              ...event,
              id: `ghost-${event.id}`,
              start: ghostStart.toISOString(),
              end: ghostEnd.toISOString(),
              backgroundColor: "#999999",
              borderColor: "#999999",
              editable: false,
              extendedProps: {
                isGhost: true,
                originalStart: event.start,
                originalEnd: event.end
              }
            });
  
            addedSeries.add(event.seriesId);
            break;
          }
  
          occurrenceStart.setDate(
            occurrenceStart.getDate() +
            (event.recurrence.frequency === "daily" ? 1 : 7)
          );
        }
  
      } else {
  
        const eventDateOnly = new Date(start);
        eventDateOnly.setHours(0, 0, 0, 0);
  
        if (
          eventDateOnly > referenceDateOnly &&
          eventDateOnly <= horizonDate &&
          start.getDay() === referenceDayIndex
        ) {
  
          const ghostStart = new Date(referenceDateOnly);
          ghostStart.setHours(start.getHours(), start.getMinutes());
  
          const ghostEnd = new Date(ghostStart.getTime() + duration);
  
          ghostEvents.push({
            ...event,
            id: `ghost-${event.id}`,
            start: ghostStart.toISOString(),
            end: ghostEnd.toISOString(),
            backgroundColor: "#999999",
            borderColor: "#999999",
            editable: false,
            extendedProps: {
              isGhost: true,
              originalStart: event.start,
              originalEnd: event.end
            }
          });
        }
      }
    });
  
    setEvents([...formattedEvents, ...ghostEvents]);
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (!res.ok) throw new Error(t("errors.loadBookings"));
  
      const data = await res.json();
  
      applyBookingsSnapshot(data);
  
    } catch (err) {
      console.error(err);
      alert(t("errors.loadBookings"));
    }
  };

  const dailyBookings = events
  .filter(e => !e.extendedProps?.isGhost) // exclude ghost events
  .filter(e => {
    const eventDate = new Date(e.start);
    return (
      eventDate.getFullYear() === currentDate.getFullYear() &&
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getDate() === currentDate.getDate()
    );
  })
  .sort((a, b) => new Date(a.start) - new Date(b.start));

  const handleSelect = (selection) => {
    const roomId = selection.resource?.id || (rooms[0]?._id || "");
    setSelectedSlot({ ...selection, roomId });
    setModalOpen(true);
  };

  const handleEventClick = (info) => {
    const booking = events.find(e => e.id === info.event.id);

    // If it's a ghost event, use originalStart/originalEnd
    const adjustedBooking = booking.extendedProps?.isGhost
    ? {
        ...booking,
        start: booking.extendedProps.originalStart,
        end: booking.extendedProps.originalEnd
      }
    : booking;

    setSelectedBooking(adjustedBooking);
    setEditModalOpen(true);
  };

  const handleCreateBooking = async ({ title, roomId, start, end, recurrence }) => {
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, roomId, start, end, recurrence })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || t("errors.bookingFailed"));
        return;
      }
      //fetchBookings(currentDate);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(t("errors.bookingFailed"));
    }
  };

  const handleUpdateBooking = async (booking) => {
    try {
      const res = await fetch(`${API}/bookings/${booking.seriesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: booking.title,
          roomId: booking.roomId,
          start: booking.start,
          end: booking.end,
          recurrence: booking.recurrence || null,
          ...(booking.userId && { userId: booking.userId }),
          ...(booking.userEmail && { userEmail: booking.userEmail })
        })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || t("errors.updateFailed"));
        return;
      }
      //fetchBookings(currentDate);
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(t("errors.updateFailed"));
    }
  };

  const handleDeleteBooking = async (booking) => {
    try {
      const res = await fetch(`${API}/bookings/${booking.seriesId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || t("errors.deleteFailed"));
        return;
      }
      //fetchBookings(currentDate);
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(t("errors.deleteFailed"));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return (
    <>
      <Header/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <input
          type="date"
          value={formatLocalDate(currentDate)}
          onChange={(e) => {
            const selected = new Date(e.target.value);
            selected.setHours(0, 0, 0, 0);
            setCurrentDate(selected);
            fetchBookings(selected);
            calendarRef.current.getApi().gotoDate(selected);
          }}
        />

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5
          }}
        >
          <span>{t("calendar.futureSearch")}: {ghostHorizonDays}</span>
          <input
            type="range"
            min={0}
            max={60}
            value={ghostHorizonDays}
            onChange={(e) => setGhostHorizonDays(Number(e.target.value))}
          />
        </label>
      </div>
      <div style={{ margin: "10px 0", display: "flex", gap: 10 }}>
        <button
          onClick={() => setViewMode("calendar")}
          style={{
            padding: "6px 12px",
            backgroundColor: viewMode === "calendar" ? "#006400" : "#ccc",
            color: viewMode === "calendar" ? "#fff" : "#000"
          }}
        >
          {t("calendar.calendarView")}
        </button>

        <button
          onClick={() => setViewMode("table")}
          style={{
            padding: "6px 12px",
            backgroundColor: viewMode === "table" ? "#006400" : "#ccc",
            color: viewMode === "table" ? "#fff" : "#000"
          }}
        >
          {t("calendar.tableView")}
        </button>

        {/* NEW BUTTON */}
        <button
          onClick={() => {
            setSelectedSlot({
              selectedDate: currentDate,
            });
            setModalOpen(true);
          }}
          style={{
            padding: "6px 12px",
            backgroundColor: "#1E90FF",
            color: "#fff"
          }}
        >
          {t("calendar.addBooking")}
        </button>
      </div>
      <div>
        {viewMode === "calendar" ? (
          <FullCalendar
            ref={calendarRef}
            schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            plugins={[resourceTimeGridPlugin, interactionPlugin]}
            initialView="resourceTimeGridDay"
            resources={resources}
            events={events}
            selectable={true}
            select={handleSelect}
            eventClick={handleEventClick}
            height="80vh"
            slotMinTime="07:00:00"
            slotMaxTime="23:00:00"
            titleFormat={{ 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            }}
            allDaySlot={false}
            locale={locale}
            buttonText={{
              today: t("calendar.today") || "Today"
            }}
            datesSet={(info) => {
              const localDate = new Date(info.start);
              localDate.setHours(0, 0, 0, 0);
              setCurrentDate(localDate);
              fetchBookings(localDate);
            }}
          />
        ) : (
          <div style={{ marginTop: 20 }}>
            <h2>
            {t("calendar.bookingsFor")}{" "}{currentDate.toLocaleDateString()}
            </h2>

            {dailyBookings.length === 0 ? (
              <p>{t("calendar.noBookings")}</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 10
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#006400", color: "white" }}>
                    <th style={{ padding: 8, border: "1px solid #ccc" }}>{t("table.time")}</th>
                    <th style={{ padding: 8, border: "1px solid #ccc" }}>{t("table.title")}</th>
                    <th style={{ padding: 8, border: "1px solid #ccc" }}>{t("table.room")}</th>
                    <th style={{ padding: 8, border: "1px solid #ccc" }}>{t("table.holder")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBookings.map(booking => {
                    const room = rooms.find(r => r._id === booking.resourceId);
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => {
                          setSelectedBooking(booking);
                          setEditModalOpen(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ padding: 8, border: "1px solid #ccc" }}>
                          {new Date(booking.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(booking.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>

                        <td style={{ padding: 8, border: "1px solid #ccc" }}>
                          {booking.title}
                        </td>

                        <td style={{ padding: 8, border: "1px solid #ccc" }}>
                          {room?.name || t("table.unknown")}
                        </td>

                        <td style={{ padding: 8, border: "1px solid #ccc" }}>
                          {booking.userEmail}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {modalOpen && selectedSlot && (
          <BookingModal
            rooms={rooms}
            defaultStart={selectedSlot.startStr}
            defaultEnd={selectedSlot.endStr}
            defaultRoomId={selectedSlot.roomId}
            selectedDate={currentDate}
            onClose={() => setModalOpen(false)}
            onSubmit={handleCreateBooking}
          />
        )}

        {editModalOpen && selectedBooking && (
          <BookingEditModal
            booking={selectedBooking}
            rooms={rooms}
            onClose={() => setEditModalOpen(false)}
            onUpdate={handleUpdateBooking}
            onDelete={handleDeleteBooking}
          />
        )}
      </div>
    </>
  );
}