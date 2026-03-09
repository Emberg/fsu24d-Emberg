// AdminPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { useLocale } from "../context/LocaleContext";

const API_BASE = "http://localhost:3000/api";

export default function Admin() {
  const { t } = useLocale();
  const { orgId } = useParams();
  const token = localStorage.getItem("token") || "";

  const [rooms, setRooms] = useState([]);
  const [keys, setKeys] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 0 });
  const [newKey, setNewKey] = useState({ rawKey: "", description: "", expiresAt: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const thStyle = { borderBottom: "2px solid #ccc", padding: "8px" };
  const tdStyle = { borderBottom: "1px solid #eee", padding: "8px" };

  // ---------- Decode JWT ----------
  const getTokenData = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const role = getTokenData()?.role;

  if (role !== "admin") {
    return <Navigate to={`/${orgId}/calendar`} replace />;
  }

  // ---------- Fetch ----------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, keysRes] = await Promise.all([
        fetch(`${API_BASE}/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/apikeys`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const roomsData = await roomsRes.json();
      const keysData = await keysRes.json();

      if (!roomsRes.ok) throw roomsData;
      if (!keysRes.ok) throw keysData;

      setRooms(roomsData);
      setKeys(keysData);
    } catch (err) {
      setError(err.message || t("adminPage.failedLoadingData"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- ROOM ACTIONS ----------

  const addRoom = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newRoom),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.message);

    setRooms([...rooms, data]);
    setNewRoom({ name: "", capacity: 0 });
  };

  const updateRoom = async (room) => {
    const res = await fetch(`${API_BASE}/rooms/${room._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(room),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.message);

    setRooms(rooms.map((r) => (r._id === room._id ? data : r)));
    setEditingRoom(null);
  };

  const deleteRoom = async (id) => {
    if (!window.confirm(t("adminPage.confirmDeleteRoom"))) return;

    await fetch(`${API_BASE}/rooms/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setRooms(rooms.filter((r) => r._id !== id));
  };

  // ---------- KEY ACTIONS ----------

  const addKey = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/apikeys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newKey),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.message);

    setKeys([...keys, data]);
    setNewKey({ name: "", value: "" });
  };

  const updateKey = async (key) => {
    const res = await fetch(`${API_BASE}/apikeys/${key._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(key),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.message);

    setKeys(keys.map((k) => (k._id === key._id ? data : k)));
    setEditingKey(null);
  };

  const deleteKey = async (id) => {
    if (!window.confirm(t("adminPage.confirmDeleteKey"))) return;

    await fetch(`${API_BASE}/apikeys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setKeys(keys.filter((k) => k._id !== id));
  };

  // ---------- UI ----------

  const cardStyle = {
    background: "#fff",
    padding: 25,
    borderRadius: 10,
    boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
    marginBottom: 40,
  };

  const inputStyle = {
    padding: 8,
    marginRight: 10,
  };

  return (
    <>
      <Header />

      <div style={{ maxWidth: 900, margin: "40px auto" }}>

        <h1>{t("adminPage.header")}</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && <p>{t("adminPage.loading")}</p>}

        {/* ROOMS */}

        <div style={cardStyle}>
          <h2>{t("adminPage.rooms")}</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>{t("adminPage.name")}</th>
                <th style={thStyle}>{t("adminPage.capacity")}</th>
                <th style={thStyle}>{t("adminPage.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {rooms.map((room) => (
                <tr key={room._id}>
                  <td style={tdStyle}>
                    {editingRoom === room._id ? (
                      <input
                        style={inputStyle}
                        value={room.name}
                        onChange={(e) =>
                          setRooms(
                            rooms.map((r) =>
                              r._id === room._id
                                ? { ...r, name: e.target.value }
                                : r
                            )
                          )
                        }
                      />
                    ) : (
                      room.name
                    )}
                  </td>

                  <td style={tdStyle}>
                    {editingRoom === room._id ? (
                      <input
                        style={inputStyle}
                        type="number"
                        value={room.capacity}
                        onChange={(e) =>
                          setRooms(
                            rooms.map((r) =>
                              r._id === room._id
                                ? { ...r, capacity: Number(e.target.value) }
                                : r
                            )
                          )
                        }
                      />
                    ) : (
                      room.capacity
                    )}
                  </td>

                  <td style={tdStyle}>
                    {editingRoom === room._id ? (
                      <>
                        <button onClick={() => updateRoom(room)}>{t("adminPage.save")}</button>
                        <button onClick={() => setEditingRoom(null)}>{t("adminPage.cancel")}</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditingRoom(room._id)}>{t("adminPage.edit")}</button>
                        <button onClick={() => deleteRoom(room._id)}>{t("adminPage.delete")}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>{t("adminPage.addRoom")}</h3>

          <form onSubmit={addRoom} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              style={{ ...inputStyle, flex: "1 1 200px" }}
              placeholder={t("adminPage.name")}
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              required
            />

            <input
              style={{ ...inputStyle, width: "100px" }}
              type="number"
              placeholder={t("adminPage.capacity")}
              value={newRoom.capacity}
              onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })}
            />

            <button type="submit">{t("adminPage.add")}</button>
          </form>
        </div>

        {/* KEYS */}
        <div style={cardStyle}>
          <h2>{t("adminPage.apiKeys")}</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>{t("adminPage.description")}</th>
                <th style={thStyle}>{t("adminPage.active")}</th>
                <th style={thStyle}>{t("adminPage.createdAt")}</th>
                <th style={thStyle}>{t("adminPage.expiresAt")}</th>
                <th style={thStyle}>{t("adminPage.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {keys.map((key) => (
                <tr key={key._id}>
                <td style={tdStyle}>
                  {editingKey === key._id ? (
                    <input
                      style={inputStyle}
                      value={key.description}
                      onChange={(e) =>
                        setKeys(
                          keys.map((k) =>
                            k._id === key._id ? { ...k, description: e.target.value } : k
                          )
                        )
                      }
                    />
                  ) : (
                    key.description
                  )}
                </td>
              
                <td style={tdStyle}>
                  {editingKey === key._id ? (
                    <select
                      style={inputStyle}
                      value={key.active ? "true" : "false"}
                      onChange={(e) =>
                        setKeys(
                          keys.map((k) =>
                            k._id === key._id
                              ? { ...k, active: e.target.value === "true" }
                              : k
                          )
                        )
                      }
                    >
                      <option value="true">{t("adminPage.active")}</option>
                      <option value="false">{t("adminPage.inactive")}</option>
                    </select>
                  ) : key.active ? (
                    t("adminPage.yes")
                  ) : (
                    t("adminPage.no")
                  )}
                </td>
              
                <td style={tdStyle}>{new Date(key.createdAt).toLocaleString()}</td>
              
                <td style={tdStyle}>
                  {editingKey === key._id ? (
                    <input
                      type="date"
                      style={inputStyle}
                      value={
                        key.expiresAt
                          ? new Date(key.expiresAt).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setKeys(
                          keys.map((k) =>
                            k._id === key._id
                              ? {
                                  ...k,
                                  expiresAt: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : null,
                                }
                              : k
                          )
                        )
                      }
                    />
                  ) : key.expiresAt ? (
                    new Date(key.expiresAt).toLocaleDateString()
                  ) : (
                    "-"
                  )}
                </td>
              
                <td style={tdStyle}>
                  {editingKey === key._id ? (
                    <>
                      <button onClick={() => updateKey(key)}>{t("adminPage.save")}</button>
                      <button onClick={() => setEditingKey(null)}>{t("adminPage.cancel")}</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditingKey(key._id)}>{t("adminPage.edit")}</button>
                      <button onClick={() => deleteKey(key._id)}>{t("adminPage.delete")}</button>
                    </>
                  )}
                </td>
              </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>{t("adminPage.addKey")}</h3>

          <form
            onSubmit={addKey}
            style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}
          >
            <input
              style={{ ...inputStyle, flex: "1 1 200px" }}
              placeholder={t("adminPage.keyValue")}
              value={newKey.rawKey || ""}
              onChange={(e) => setNewKey({ ...newKey, rawKey: e.target.value })}
              required
            />

            <input
              style={{ ...inputStyle, flex: "1 1 200px" }}
              placeholder={t("adminPage.description")}
              value={newKey.description || ""}
              onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
              required
            />

            <input
              style={{ ...inputStyle, width: "150px" }}
              type="date"
              placeholder={t("adminPage.expiryDate")}
              value={
                newKey.expiresAt
                  ? new Date(newKey.expiresAt).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setNewKey({
                  ...newKey,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />

            <button type="submit">{t("adminPage.add")}</button>
          </form>
        </div>
      </div>
    </>
  );
}