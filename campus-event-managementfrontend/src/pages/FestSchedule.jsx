import "./FestSchedule.css";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/events";

export default function FestSchedule() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [rejectReason, setRejectReason] = useState({});
  const [message, setMessage] = useState("");

  // Existing login system se user aur token read karo.
  const token = localStorage.getItem("token");

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const role = String(user.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isOrganizer = role === "organizer";
  const isStudent = role === "student";

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      if (!response.ok) {
        throw new Error(`Events load nahi hue (${response.status})`);
      }

      const result = await response.json();

      // API direct array ya { events: [...] } return kar sakti hai.
      const list = Array.isArray(result)
        ? result
        : result.events || result.data || [];

      setEvents(list);
    } catch (err) {
      setError(err.message || "Events load karne mein problem hui.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // Student ko sirf approved events dikhne chahiye.
  const visibleEvents = isStudent
    ? events.filter(
        (event) =>
          String(event.status || "").toLowerCase() === "approved"
      )
    : events;

  function getDay(event) {
    const description = event.description || "";
    const match = description.match(/\bDay\s*(\d+)\b/i);

    if (match) return Number(match[1]);

    // Agar backend mein day field hai toh use karo.
    const day = Number(event.day);
    return day >= 1 && day <= 4 ? day : 99;
  }

  function getOwnerId(event) {
    const owner = event.organizer || event.createdBy;
    return typeof owner === "object" ? owner?._id : owner;
  }

  const myId = user._id || user.id;
  const myEmail = String(user.email || "").toLowerCase();

  function ownsEvent(event) {
    const ownerId = getOwnerId(event);
    const ownerEmail =
      typeof event.organizer === "object"
        ? event.organizer?.email
        : event.organizerEmail;

    return (
      (ownerId && myId && String(ownerId) === String(myId)) ||
      (ownerEmail && myEmail &&
        String(ownerEmail).toLowerCase() === myEmail)
    );
  }

  async function adminAction(event, action) {
    setBusyId(String(event._id));
    setMessage("");
    setError("");

    try {
      const body =
        action === "reject"
          ? { reason: rejectReason[event._id] || "" }
          : {};

      if (action === "reject" && !body.reason.trim()) {
        throw new Error("Reject karne ke liye reason likho.");
      }

      // In endpoints ko apne backend ke actual routes se match karna.
      const response = await fetch(
        `${API_URL}/${event._id}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Action fail hua.");
      }

      setMessage(
        action === "approve"
          ? "Event approved!"
          : "Event rejected."
      );

      await loadEvents();
    } catch (err) {
      setError(err.message || "Action complete nahi hua.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p>Loading fest schedule...</p>;

  if (error && events.length === 0) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={loadEvents}>Retry</button>
      </div>
    );
  }

  return (
    <main className="fest-page">
      <h1>Campus Fest Schedule</h1>
      <p>Day 1 – Day 4 · Sports, Technical, Cultural & Indoor Games</p>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <div className="fest-table-wrap">
        <table className="fest-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Event</th>
              <th>Category</th>
              <th>Venue</th>
              <th>Organizer</th>
              {isAdmin && <th>Status / Approval</th>}
              {isStudent && <th>Registration</th>}
              {isOrganizer && <th>Management</th>}
            </tr>
          </thead>

          <tbody>
            {visibleEvents
              .slice()
              .sort((a, b) => {
                const dayDiff = getDay(a) - getDay(b);
                if (dayDiff) return dayDiff;
                return String(a.startTime || "").localeCompare(
                  String(b.startTime || "")
                );
              })
              .map((event) => {
                const own = ownsEvent(event);
                const status = String(event.status || "unknown")
                  .toLowerCase();

                return (
                  <tr key={event._id}>
                    <td>
                      {getDay(event) === 99
                        ? "Other"
                        : `Day ${getDay(event)}`}
                    </td>
                    <td>
                      {event.startTime || "—"} – {event.endTime || "—"}
                    </td>
                    <td>
                      <strong>{event.title}</strong>
                      <div>{event.description || ""}</div>
                    </td>
                    <td>{event.category || "—"}</td>
                    <td>{event.venue || "—"}</td>
                    <td>
                      {typeof event.organizer === "object"
                        ? event.organizer?.email ||
                          event.organizer?.name ||
                          "Organizer"
                        : event.organizerEmail || "Organizer"}
                    </td>

                    {isAdmin && (
                      <td>
                        <span>{status}</span>
                        {status === "pending" ||
                        status === "pending approval" ? (
                          <div className="fest-actions">
                            <button
                              disabled={busyId === String(event._id)}
                              onClick={() => adminAction(event, "approve")}
                            >
                              Approve
                            </button>
                            <input
                              value={rejectReason[event._id] || ""}
                              placeholder="Rejection reason"
                              onChange={(e) =>
                                setRejectReason((prev) => ({
                                  ...prev,
                                  [event._id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              disabled={busyId === String(event._id)}
                              onClick={() => adminAction(event, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </td>
                    )}

                    {isOrganizer && (
                      <td>
                        {own ? (
                          <span>My event — manage</span>
                        ) : (
                          <span>View only</span>
                        )}
                      </td>
                    )}

                    {isStudent && (
                      <td>
                        <button
                          onClick={() =>
                            window.location.assign(
                              `/events/${event._id}`
                            )
                          }
                        >
                          View / Register
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {visibleEvents.length === 0 && (
        <p>No events available for this account.</p>
      )}
    </main>
  );
}