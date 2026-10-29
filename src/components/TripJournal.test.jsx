import { render, screen } from "@testing-library/react";
import TripJournal from "./TripJournal";

test("renders the trip journal entries", () => {
  render(
    <TripJournal
      title="Goa Trip Journal"
      entries={[
        { day: "Day 1", note: "Checked into the beach resort." },
        { day: "Day 2", note: "Explored Old Goa and local cafes." },
      ]}
    />
  );

  expect(screen.getByRole("heading", { name: /goa trip journal/i })).toBeInTheDocument();
  expect(screen.getByText(/checked into the beach resort\./i)).toBeInTheDocument();
  expect(screen.getByText(/explored old goa and local cafes\./i)).toBeInTheDocument();
});
