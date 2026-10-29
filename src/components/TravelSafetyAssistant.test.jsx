import { render, screen } from "@testing-library/react";
import TravelSafetyAssistant from "./TravelSafetyAssistant";

test("renders the travel safety assistant with status and alerts", () => {
  render(
    <TravelSafetyAssistant
      status="Monitoring"
      insights={["Check weather before your departure.", "Keep local emergency contacts handy."]}
    />
  );

  expect(screen.getByRole("heading", { name: /travel safety assistant/i })).toBeInTheDocument();
  expect(screen.getByText(/monitoring/i)).toBeInTheDocument();
  expect(screen.getByText(/check weather before your departure\./i)).toBeInTheDocument();
});
