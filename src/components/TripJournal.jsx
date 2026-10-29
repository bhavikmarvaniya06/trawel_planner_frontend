import React from "react";

function TripJournal({ entries = [], title = "Trip Journal" }) {
  return (
    <section className="trip-journal" aria-label="Trip journal">
      <h2>{title}</h2>

      {entries.length > 0 ? (
        <ul>
          {entries.map((entry, index) => (
            <li key={`${entry}-${index}`}>
              <strong>{entry.day}</strong>
              <span>{entry.note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No journal entries yet.</p>
      )}
    </section>
  );
}

export default TripJournal;
