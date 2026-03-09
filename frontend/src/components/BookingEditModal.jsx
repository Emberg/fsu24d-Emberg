import { useState, useEffect } from "react";
import { useLocale } from "../context/LocaleContext";

const API = process.env.API;

function getTokenData() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

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

export default function BookingEditModal({ booking, rooms, onClose, onUpdate, onDelete}) {
  const { t } = useLocale();

  const token = localStorage.getItem("token");
  const tokenData = getTokenData();
  const isAdmin = tokenData?.role === "admin";

  const [orgUsers, setOrgUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [title, setTitle] = useState("");
  const [holder, setHolder] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [repeatUntil, setRepeatUntil] = useState("");

  useEffect(() => {
    setTitle(booking.title || "");
    setHolder(booking.userEmail);
    setSelectedUserId(booking.userId || "");
    setRoomId(booking.resourceId);
    setDate(formatDateForInput(booking.start));
    setStartTime(formatTimeForInput(booking.start));
    setEndTime(formatTimeForInput(booking.end));

    if (booking.recurrence && booking.recurrence.repeatUntil) {
      setIsRecurring(true);
      setFrequency(booking.recurrence.frequency || "weekly");
      setRepeatUntil(formatDateForInput(booking.recurrence.repeatUntil));
    } else {
      setIsRecurring(false);
      setFrequency("weekly");
      setRepeatUntil("");
    }
  }, [booking]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const orgId = tokenData.orgId;

        const res = await fetch(`${API}/${orgId}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();
        const data = await res.json();
        setOrgUsers(data);
      } catch {
        alert(t("editModal.failedToLoadUsers"));
      }
    };

    fetchUsers();
  }, [isAdmin, token, t]);

  const filteredEndTimes = TIME_OPTIONS.filter(t => t > startTime);

  const handleHolderChange = (email) => {
    setHolder(email);

    const user = orgUsers.find(u => u.email === email);
    if (user) {
      setSelectedUserId(user._id);
    }
  };

  const handleUpdate = () => {
    if (!title || !roomId || !date || !startTime || !endTime) {
      return alert(t("editModal.fillAllRequiredFields"));
    }

    const start = new Date(`${date}T${startTime}`).toISOString();
    const end = new Date(`${date}T${endTime}`).toISOString();

    if (new Date(start) >= new Date(end)) {
      return alert(t("editModal.endTimeAfterStartTime"));
    }

    if (isRecurring && !repeatUntil) {
      return alert(t("editModal.selectRepeatEndDate"));
    }

    onUpdate({
      ...booking,
      title,
      roomId,
      start,
      end,
      recurrence: isRecurring ? { frequency, repeatUntil } : null,
      userId: isAdmin ? selectedUserId : booking.userId,
      userEmail: isAdmin ? holder : booking.userEmail
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm(t("editModal.confirmDeleteBooking"))) {
      onDelete(booking);
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, minWidth: 320 }}>
        <h3>{t("editModal.editBooking")}</h3>

        <input placeholder={t("editModal.title")} value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />

        <select value={roomId} onChange={e => setRoomId(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>

        <label>{t("editModal.holder")}:</label>
        {isAdmin ? (
          <>
            <input
              list="users"
              value={holder}
              onChange={e => handleHolderChange(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
            />
            <datalist id="users">
              {orgUsers.map(user => (
                <option key={user._id} value={user.email} />
              ))}
            </datalist>
          </>
        ) : (
          <input
            value={holder}
            disabled
            style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
          />
        )}

        <label>{t("editModal.date")}:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />

        <label>{t("editModal.startTime")}:</label>
        <select value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label>{t("editModal.endTime")}:</label>
        <select value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
          {filteredEndTimes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={{ marginTop: 10 }}>
          <label>
            <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} style={{ marginRight: 6 }} />
            {t("editModal.repeatBooking")}
          </label>
        </div>

        {isRecurring && <>
          <label style={{ marginTop: 8, display: "block" }}>{t("editModal.frequency")}:</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
            <option value="daily">{t("editModal.daily")}</option>
            <option value="weekly">{t("editModal.weekly")}</option>
          </select>

          <label>{t("editModal.repeatUntil")}:</label>
          <input type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
        </>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={handleUpdate} style={{ padding: 8 }}>{t("editModal.update")}</button>
          <button onClick={handleDelete} style={{ padding: 8, backgroundColor: "#ff4d4d", color: "#fff" }}>{t("editModal.delete")}</button>
          <button onClick={onClose} style={{ padding: 8 }}>{t("editModal.cancel")}</button>
        </div>
      </div>
    </div>
  );
}