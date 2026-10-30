
import React from "react";

const events = [
  { day: "Day 1 — Sports", time: "09:00–11:00", event: "Badminton Championship", category: "Sports", organizer: "organizer2@campus.edu" },
  { day: "Day 1", time: "11:30–13:30", event: "Kabaddi Championship", category: "Sports", organizer: "organizer2@campus.edu" },
  { day: "Day 1", time: "14:00–16:00", event: "Football Championship", category: "Sports", organizer: "organizer2@campus.edu" },
  { day: "Day 1", time: "16:30–18:00", event: "Table Tennis Tournament", category: "Sports", organizer: "organizer2@campus.edu" },

  { day: "Day 2 — Technical", time: "09:00–11:00", event: "Coding Competition", category: "Competition", organizer: "organizer@campus.edu" },
  { day: "Day 2", time: "11:30–13:30", event: "Robotics Challenge", category: "Technical", organizer: "organizer3@campus.edu" },
  { day: "Day 2", time: "14:00–16:00", event: "AI & ML Workshop", category: "Workshop", organizer: "organizer@campus.edu" },
  { day: "Day 2", time: "16:30–18:00", event: "Cyber Security Quiz", category: "Technical", organizer: "organizer@campus.edu" },

  { day: "Day 3 — Cultural & Career", time: "09:00–11:00", event: "Singing Competition", category: "Cultural", organizer: "organizer2@campus.edu" },
  { day: "Day 3", time: "11:30–13:30", event: "Dance Competition", category: "Cultural", organizer: "organizer2@campus.edu" },
  { day: "Day 3", time: "14:00–16:00", event: "Poster Making Competition", category: "Competition", organizer: "organizer2@campus.edu" },
  { day: "Day 3", time: "16:30–18:00", event: "Placement & Career Seminar", category: "Placement", organizer: "organizer2@campus.edu" },

  { day: "Day 4 — Sports & Indoor Games", time: "09:00–11:00", event: "Carrom Championship", category: "Sports", organizer: "organizer2@campus.edu" },
  { day: "Day 4", time: "11:30–13:30", event: "Table Tennis Championship", category: "Sports", organizer: "organizer2@campus.edu" },
  { day: "Day 4", time: "14:00–16:00", event: "Chess Championship", category: "Sports", organizer: "organizer2@campus.edu" },
];

export default function EventScheduleTable() {
  return (
    <div style={{ padding: 20, overflowX: "auto" }}>
      <h2>Campus Fest — Event Schedule</h2>
      <p>Total Events: {events.length}</p>

      <table style={{
        width: "100%",
        minWidth: 850,
        borderCollapse: "collapse",
        background: "#fff"
      }}>
        <thead>
          <tr style={{ background: "#243b80", color: "#fff" }}>
            {["Day", "Time", "Event", "Category", "Organizer Login"].map(
              heading => (
                <th key={heading} style={cellStyle}>{heading}</th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {events.map((item, index) => (
            <tr key={item.event}
              style={{ background: index % 2 ? "#fff" : "#f5f7ff" }}>
              <td style={cellStyle}>{item.day}</td>
              <td style={cellStyle}>{item.time}</td>
              <td style={cellStyle}>{item.event}</td>
              <td style={cellStyle}>{item.category}</td>
              <td style={cellStyle}>{item.organizer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  padding: 12,
  border: "1px solid #ddd",
  textAlign: "left",
  color: "#222"
};