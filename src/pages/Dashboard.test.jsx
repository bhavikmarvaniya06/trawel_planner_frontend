import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import api from "../services/api";
import Dashboard from "./Dashboard";
import { destinationFallbackImage } from "../data/destinations";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({ user: { name: "Taylor", email: "taylor@example.com" } }),
}));

test("shows admin-managed featured destinations on the user dashboard", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : {
                  data: {
                      destinations: [{
                          _id: "destination-1",
                          name: "Reykjavik",
                          country: "Iceland",
                          description: "Waterfalls, hot springs, and dramatic coastlines.",
                          imageUrl: "https://example.com/reykjavik.jpg",
                      }],
                  },
              }
    ));

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Reykjavik" })).toBeInTheDocument();
    expect(screen.getByText("Waterfalls, hot springs, and dramatic coastlines.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Reykjavik" })).toHaveAttribute("src", "https://example.com/reykjavik.jpg");

    fireEvent.error(screen.getByRole("img", { name: "Reykjavik" }));
    expect(screen.getByRole("img", { name: "Reykjavik" })).toHaveAttribute("src", destinationFallbackImage);
});
