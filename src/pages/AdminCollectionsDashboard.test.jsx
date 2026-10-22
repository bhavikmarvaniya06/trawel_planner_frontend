import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import api from "../services/api";
import AdminCollectionsDashboard from "./AdminCollectionsDashboard";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({ logout: jest.fn() }),
}));

test("shows AI-generated daily tasks in the admin dashboard", async () => {
    api.get.mockResolvedValue({
        data: {
            users: [],
            trips: [],
            queries: [],
            feedback: [],
            destinations: [],
            itineraries: [],
            expenses: [],
            stats: { totalUsers: 0, tripCount: 0, averageRating: 0, budgetSummary: [] },
        },
    });
    api.post.mockResolvedValue({
        data: {
            date: "2026-10-22",
            tasks: [{
                title: "Review open traveler requests",
                details: "Respond to outstanding customer queries.",
                priority: "high",
                category: "Customer support",
            }],
        },
    });

    render(
        <MemoryRouter>
            <AdminCollectionsDashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "AI daily tasks" })).toBeInTheDocument();
    expect(await screen.findByText("Review open traveler requests")).toBeInTheDocument();
    expect(screen.getByText("Respond to outstanding customer queries.")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/admin/daily-tasks", {});
});

test("explains when the deployed backend does not have the daily-tasks endpoint", async () => {
    api.get.mockResolvedValue({
        data: {
            users: [],
            trips: [],
            queries: [],
            feedback: [],
            destinations: [],
            itineraries: [],
            expenses: [],
            stats: { totalUsers: 0, tripCount: 0, averageRating: 0, budgetSummary: [] },
        },
    });
    api.post.mockRejectedValue({ response: { status: 404, data: "Not Found" } });

    render(
        <MemoryRouter>
            <AdminCollectionsDashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
        "The daily-tasks API is missing from the deployed backend. Deploy the latest backend, then retry."
    );
});
