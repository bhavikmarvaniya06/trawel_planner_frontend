import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import api from "../services/api";
import TripDetails from "./TripDetails";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({ user: { _id: "owner-1", name: "Taylor", email: "taylor@example.com" } }),
}));

const trip = {
    _id: "trip-1",
    user: { _id: "owner-1", name: "Taylor", email: "taylor@example.com" },
    destination: "Goa",
    startDate: "2030-03-01T00:00:00.000Z",
    endDate: "2030-03-03T00:00:00.000Z",
    travelers: 2,
    budget: 10000,
    currency: "INR",
    travelStyle: "balanced",
    interests: ["beaches"],
    itinerary: [{
        day: 1,
        date: "2030-03-01T00:00:00.000Z",
        title: "Beach day",
        estimatedCost: 500,
        activities: [{ title: "Visit the beach", type: "sightseeing" }],
    }],
};

const weatherForecast = {
    success: true,
    forecastAvailable: true,
    forecastThrough: "2030-03-03",
    forecast: [{
        date: "2030-03-01",
        weatherCode: 61,
        temperatureMax: 29,
        temperatureMin: 22,
        precipitation: 12,
        precipitationProbability: 80,
        windSpeed: 12,
        conditions: ["rain"],
        suggestions: ["Swap outdoor sightseeing for museums or covered markets."],
    }],
};

beforeEach(() => {
    localStorage.clear();
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips/trip-1"
            ? { data: { trip } }
            : { data: weatherForecast }
    ));
});

afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

const renderTripDetails = () => render(
    <MemoryRouter initialEntries={["/trips/trip-1"]}>
        <Routes>
            <Route path="/trips/:id" element={<TripDetails />} />
        </Routes>
    </MemoryRouter>
);

test("shows the trip forecast, weather risks, and alternative suggestions", async () => {
    renderTripDetails();

    expect(await screen.findByRole("heading", { name: "Weather in Goa" })).toBeInTheDocument();
    expect(screen.getByText("Light rain")).toBeInTheDocument();
    expect(screen.getByText(/Plan for rain/i)).toBeInTheDocument();
    expect(screen.getByText(/covered markets/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Group trip planning" })).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/trips/trip-1/weather");

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(3);
    });
});

test("explains when a forecast is not yet available for the trip dates", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips/trip-1"
            ? { data: { trip } }
            : {
                  data: {
                      success: true,
                      forecastAvailable: false,
                      message: "Forecasts are available for the next 16 days. Check back closer to your trip.",
                      forecast: [],
                  },
              }
    ));
    renderTripDetails();

    expect(await screen.findByRole("status")).toHaveTextContent(/next 16 days/i);
});

test("labels archived weather and shows the regional estimate location", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips/trip-1"
            ? { data: { trip } }
            : {
                  data: {
                      success: true,
                      forecastAvailable: true,
                      forecastType: "historical",
                      weatherLocation: "Jaipur (regional estimate for Rajasthan)",
                      forecast: [{
                          date: "2030-03-01",
                          weatherCode: 0,
                          temperatureMax: 31,
                          temperatureMin: 18,
                          precipitation: 0,
                          windSpeed: 8,
                          conditions: [],
                          suggestions: [],
                      }],
                  },
              }
    ));
    renderTripDetails();

    expect(await screen.findByText("HISTORICAL WEATHER")).toBeInTheDocument();
    expect(screen.getByText(/Based on Jaipur \(regional estimate for Rajasthan\)/i)).toBeInTheDocument();
    expect(screen.getByText("0 mm precipitation")).toBeInTheDocument();
});
