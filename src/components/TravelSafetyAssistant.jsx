import React from "react";

function TravelSafetyAssistant({ insights = [], status = "Ready" }) {
  return (
    <section className="travel-safety-assistant" aria-label="Travel safety assistant">
      <header>
        <h2>Travel Safety Assistant</h2>
        <span aria-live="polite">{status}</span>
      </header>

      {insights.length > 0 ? (
        <ul>
          {insights.map((insight, index) => (
            <li key={`${insight}-${index}`}>{insight}</li>
          ))}
        </ul>
      ) : (
        <p>No safety alerts right now.</p>
      )}
    </section>
  );
}

export default TravelSafetyAssistant;
