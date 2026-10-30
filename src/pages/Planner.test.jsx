import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import api from "../services/api";
import Planner from "./Planner";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({ user: { name: "Taylor", email: "taylor@example.com" } }),
}));

jest.mock("../components/SiteNavbar", () => () => <nav>TripAI</nav>);

jest.mock("../components/OptimizedRouteMap", () => ({
    __esModule: true,
    default: ({ origin }) => <div role="region" aria-label={`OpenStreetMap route from ${origin}`} />,
}));

afterEach(() => {
    jest.clearAllMocks();
});

test("date picker starts at today and rejects dates in the past", async () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const today = now.toISOString().slice(0, 10);

    render(
        <MemoryRouter initialEntries={["/planner"]}>
            <Planner />
        </MemoryRouter>
    );

    const startDate = screen.getByLabelText("Start date");
    expect(startDate).toHaveAttribute("min", today);

    fireEvent.change(startDate, { target: { value: "2000-01-01" } });
    fireEvent.submit(startDate.closest("form"));

    expect(await screen.findByText("Choose a start date that is today or later.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
});

test("optimizes selected places and displays route metrics, map and OSM directions", async () => {
    api.post.mockImplementation(async (path) => {
        if (path === "/trips/suggestions") {
            return {
                data: {
                    type: "places",
                    source: "test",
                    suggestions: [
                        { name: "Fort Aguada", category: "History", description: "A coastal fort." },
                        { name: "Fontainhas", category: "Culture", description: "A historic quarter." },
                    ],
                },
            };
        }
        if (path === "/trips/optimize-route") {
            return {
                data: {
                    origin: "Goa",
                    stops: [
                        { name: "Fontainhas", order: 1 },
                        { name: "Fort Aguada", order: 2 },
                    ],
                    summary: {
                        distanceMeters: 12000,
                        durationSeconds: 900,
                        estimatedCostInr: 144,
                        estimatedCostNote: "Indicative estimate at ₹12/km.",
                        travelMode: "DRIVE",
                        objective: "time",
                    },
                    route: {
                        coordinates: [[15, 73], [15.1, 73.1], [15.2, 73.2]],
                        waypoints: [
                            { name: "Goa", location: { latitude: 15, longitude: 73 } },
                            { name: "Fontainhas", location: { latitude: 15.1, longitude: 73.1 } },
                            { name: "Fort Aguada", location: { latitude: 15.2, longitude: 73.2 } },
                        ],
                        directions: [{
                            from: "Goa",
                            to: "Fontainhas",
                            distanceMeters: 5000,
                            durationSeconds: 400,
                            startLocation: null,
                            endLocation: null,
                            steps: [{ instruction: "Head north", distanceMeters: 5000, durationSeconds: 400 }],
                        }, {
                            from: "Fontainhas",
                            to: "Fort Aguada",
                            distanceMeters: 7000,
                            durationSeconds: 500,
                            startLocation: null,
                            endLocation: null,
                            steps: [],
                        }],
                    },
                },
            };
        }
        throw new Error(`Unexpected request: ${path}`);
    });

    render(
        <MemoryRouter initialEntries={["/planner?destination=Goa"]}>
            <Planner />
        </MemoryRouter>
    );

    const fortSuggestion = (await screen.findByText("Fort Aguada")).closest("article");
    fireEvent.click(within(fortSuggestion).getByRole("button", { name: /add to plan/i }));
    const quarterSuggestion = screen.getByText("Fontainhas").closest("article");
    fireEvent.click(within(quarterSuggestion).getByRole("button", { name: /add to plan/i }));

    fireEvent.change(screen.getByLabelText("Optimize for"), { target: { value: "time" } });
    fireEvent.click(screen.getByRole("button", { name: /optimize selected stops/i }));

    await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/trips/optimize-route", {
            origin: "Goa",
            stops: ["Fort Aguada", "Fontainhas"],
            travelMode: "DRIVE",
            objective: "time",
        });
    });
    expect(await screen.findByText("Total travel time")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
    expect(screen.getByText("12 km")).toBeInTheDocument();
    expect(screen.getByText("₹144")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /openstreetmap route from goa/i })).toBeInTheDocument();
    expect(screen.getByText("Head north")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open in OpenStreetMap" })).toHaveAttribute(
        "href",
        expect.stringContaining("https://www.openstreetmap.org/directions?")
    );
});

test("saves a published package through the existing trip-credit planner flow", async () => {
    api.get.mockResolvedValue({
        data: {
            destination: {
                _id: "destination-1",
                name: "Lake District",
                price: 1500,
                currency: "INR",
                durationDays: 3,
                itinerary: [{ day: 1, title: "Arrival", activities: ["Check in"] }],
                bookingDetails: { available: true },
            },
        },
    });
    api.post.mockResolvedValue({
        data: {
            trip: { _id: "trip-1" },
        },
    });

    render(
        <MemoryRouter initialEntries={["/planner?destinationPackageId=destination-1"]}>
            <Planner />
        </MemoryRouter>
    );

    expect(await screen.findByText("Lake District")).toBeInTheDocument();
    expect(screen.getByText(/uses your existing free-trip or trip-credit rules/i)).toBeInTheDocument();
    fireEvent.change(document.querySelector('input[name="startDate"]'), {
        target: { value: "2027-04-01" },
    });
    fireEvent.change(screen.getByLabelText("Number of travelers"), {
        target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with this package" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/trips", {
        destination: "Lake District",
        startDate: "2027-04-01",
        endDate: "2027-04-03",
        places: [],
        travelers: 2,
        budget: 3000,
        travelStyle: "balanced",
        interests: [],
        destinationPackageId: "destination-1",
    }));
});
