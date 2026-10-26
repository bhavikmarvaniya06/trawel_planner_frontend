import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import api from "../services/api";
import AdminCollectionsDashboard from "./AdminCollectionsDashboard";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({
        user: { name: "TripAI Admin", email: "admin@tripai.com", role: "admin" },
        logout: jest.fn(),
    }),
}));

afterEach(() => {
    jest.clearAllMocks();
});

test("renders admin collections dashboard with stats and views", async () => {
    api.put.mockResolvedValue({
        data: {
            package: { _id: "p1", key: "one-trip", name: "1 AI trip", credits: 1, amountPaise: 9900, active: true },
        },
    });
    api.get.mockResolvedValue({
        data: {
            users: [
                { _id: "u1", name: "Alice", email: "alice@example.com", role: "user", freeTripUsed: true, tripCredits: 2, createdAt: "2026-01-01" },
            ],
            trips: [
                { _id: "t1", destination: "Goa", user: { name: "Alice" }, startDate: "2026-11-01", endDate: "2026-11-05", status: "planned", budget: 15000, currency: "INR" },
            ],
            queries: [
                { _id: "q1", name: "Bob", email: "bob@example.com", query: "Need help booking", status: "open", createdAt: "2026-01-02" },
            ],
            feedback: [
                { _id: "f1", name: "Charlie", rating: 5, message: "Loved it!", createdAt: "2026-01-03" },
            ],
            destinations: [
                { _id: "d1", name: "Goa", country: "India", active: true },
            ],
            itineraries: [],
            expenses: [],
            packages: [
                { _id: "p1", key: "one-trip", name: "1 AI trip", credits: 1, amountPaise: 8900, active: true },
            ],
            payments: [
                { _id: "payment-1", user: { name: "Alice" }, packageName: "1 AI trip", credits: 1, amountPaise: 8900, currency: "INR", status: "paid", razorpayPaymentId: "pay_test_1", paidAt: "2026-01-03" },
            ],
            stats: {
                totalUsers: 1,
                tripCount: 1,
                averageRating: 5.0,
                budgetSummary: [{ currency: "INR", budget: 15000, expenses: 0 }],
                revenuePaise: 8900,
                paidPaymentCount: 1,
                totalTripCredits: 2,
            },
        },
    });

    render(
        <MemoryRouter>
            <AdminCollectionsDashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Travel operations" })).toBeInTheDocument();
    expect(screen.getByText("Total users")).toBeInTheDocument();
    expect(screen.getByText("Total trips")).toBeInTheDocument();
    expect(screen.getByText(/₹89/)).toBeInTheDocument();
    expect(screen.getByText("AI trip package pricing")).toBeInTheDocument();

    const usersTab = screen.getByRole("button", { name: /^Users/ });
    expect(usersTab).toBeInTheDocument();
    fireEvent.click(usersTab);

    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Trip credits")).toBeInTheDocument();
    expect(screen.getByText("Used")).toBeInTheDocument();

    const priceInput = screen.getByRole("spinbutton", { name: "1 AI trip price in rupees" });
    fireEvent.change(priceInput, { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Save price" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/payment-packages/p1", { amountPaise: 9900 }));

    fireEvent.click(screen.getByRole("button", { name: /^Payments/ }));
    expect(await screen.findByText("pay_test_1")).toBeInTheDocument();
});

test("creates a published destination package and uploads selected photos", async () => {
    api.get.mockResolvedValue({
        data: {
            users: [],
            trips: [],
            queries: [],
            feedback: [],
            destinations: [],
            itineraries: [],
            expenses: [],
            packages: [],
            payments: [],
            stats: {},
        },
    });
    api.post.mockImplementation(async (path, payload) => {
        if (path === "/admin/destinations") {
            return {
                data: {
                    destination: {
                        _id: "destination-1",
                        ...payload,
                        images: [],
                    },
                },
            };
        }
        if (path === "/admin/destinations/destination-1/images") {
            return { data: { success: true, images: [] } };
        }
        throw new Error(`Unexpected request: ${path}`);
    });

    render(
        <MemoryRouter>
            <AdminCollectionsDashboard />
        </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /^Destinations/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add destination package" }));
    fireEvent.change(screen.getByLabelText("Destination name"), { target: { value: "Lake District" } });
    fireEvent.change(screen.getByLabelText("Price per traveler"), { target: { value: "1800" } });
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "INR" } });
    fireEvent.change(screen.getByLabelText("Duration (days)"), { target: { value: "2" } });
    fireEvent.change(
        screen.getByLabelText("Itinerary (JSON array: day, title, description, activities)"),
        { target: { value: '[{"day":1,"title":"Arrival","activities":["Check in"]}]' } }
    );
    const image = new File(["image"], "lake.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/Add photos/), { target: { files: [image] } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
        "/admin/destinations",
        expect.objectContaining({
            name: "Lake District",
            price: 1800,
            currency: "INR",
            durationDays: 2,
            active: true,
            itinerary: [{ day: 1, title: "Arrival", activities: ["Check in"] }],
            bookingDetails: expect.objectContaining({ available: true }),
        })
    ));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
        "/admin/destinations/destination-1/images",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } }
    ));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
