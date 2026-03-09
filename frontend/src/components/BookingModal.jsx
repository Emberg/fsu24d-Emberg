import { useState, useEffect } from "react";
import { useLocale } from "../context/LocaleContext";

// Generate 15-min interval times
const generateTimeOptions = (startHour = 7, endHour = 22) => {
  const times = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, "0");
      const min = m.toString().padStart(2, "0");
      times.push(`${hour}:${min}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTimeForInput = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function BookingModal({
  rooms,
  onClose,
  onSubmit,
  defaultStart,
  defaultEnd,
  defaultRoomId,
  selectedDate
}) {
  const { t } = useLocale();

  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [repeatUntil, setRepeatUntil] = useState("");

  useEffect(() => {
    if (defaultStart) {
      setDate(formatDateForInput(defaultStart));
      setStartTime(formatTimeForInput(defaultStart));
      setEndTime(formatTimeForInput(defaultEnd));
    } else if (selectedDate) {
      const base = new Date(selectedDate);
      const pad = (n) => n.toString().padStart(2, "0");
      setDate(`${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`);
      setStartTime("09:00");
      setEndTime("10:00");
    }
    setRoomId(defaultRoomId || rooms[0]?._id || "");
  }, [defaultStart, defaultEnd, defaultRoomId, selectedDate, rooms]);

  const filteredEndTimes = TIME_OPTIONS.filter(t => t > startTime);

  const handleSubmit = () => {
    if (!title || !roomId || !date || !startTime || !endTime) {
      alert(t("bookingModal.fillAllFields"));
      return;
    }

    const start = new Date(`${date}T${startTime}`).toISOString();
    const end = new Date(`${date}T${endTime}`).toISOString();

    if (new Date(start) >= new Date(end)) {
      alert(t("bookingModal.endAfterStart"));
      return;
    }

    if (isRecurring && !repeatUntil) {
      alert(t("bookingModal.selectRepeatUntil"));
      return;
    }

    onSubmit({
      title,
      roomId,
      start,
      end,
      recurrence: isRecurring
        ? { frequency, repeatUntil }
        : null
    });

    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, minWidth: 320 }}>
        <h3>{t("bookingModal.createBooking")}</h3>

        <input 
          placeholder={t("bookingModal.title")}
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} 
        />

        <select value={roomId} onChange={e => setRoomId(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>

        <label>{t("bookingModal.date")}:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />

        <label>{t("bookingModal.startTime")}:</label>
        <select value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label>{t("bookingModal.endTime")}:</label>
        <select value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {filteredEndTimes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={{ marginTop: 10 }}>
          <label>
            <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} style={{ marginRight: 6 }} />
            {t("bookingModal.repeatBooking")}
          </label>
        </div>

        {isRecurring && <>
          <label style={{ marginTop: 8, display: "block" }}>{t("bookingModal.frequency")}:</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
            <option value="daily">{t("bookingModal.daily")}</option>
            <option value="weekly">{t("bookingModal.weekly")}</option>
          </select>

          <label>{t("bookingModal.repeatUntil")}:</label>
          <input type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
        </>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={handleSubmit} style={{ padding: 8 }}>{t("bookingModal.create")}</button>
          <button onClick={onClose} style={{ padding: 8 }}>{t("bookingModal.cancel")}</button>
        </div>
      </div>
    </div>
  );
}