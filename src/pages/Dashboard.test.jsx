import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

import api from "../services/api";
import Dashboard from "./Dashboard";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({ user: { name: "Taylor", email: "taylor@example.com" } }),
}));

function CurrentPath() {
    const location = useLocation();
    return <output data-testid="current-path">{location.pathname}</output>;
}

afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    delete window.Razorpay;
    delete window.checkoutOptions;
});

test("omits featured destinations from My Trips without requesting them", async () => {
    api.get.mockResolvedValue({
        data: {
            trips: [],
            freeTripAvailable: true,
            tripCredits: 0,
            packages: [],
            payments: [],
            destinations: [],
            invitations: [],
            notifications: [],
            recommendations: [],
        },
    });

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "My Trips" })).toBeInTheDocument();
    expect(screen.queryByText("Featured destinations")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explore all/i })).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/destinations");
});

test("starts a new trip from the My Trips section", async () => {
    api.get.mockResolvedValue({
        data: {
            trips: [],
            freeTripAvailable: true,
            tripCredits: 0,
            packages: [],
            payments: [],
            destinations: [],
            invitations: [],
            notifications: [],
            recommendations: [],
        },
    });

    render(
        <MemoryRouter>
            <Dashboard />
            <CurrentPath />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "My Trips" })).toBeInTheDocument();
    expect(screen.queryByText("Featured destinations")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^new trip$/i }));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/planner");
});

test("shows subscription packages only in the poster after redirecting from an exhausted account", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/payments/account"
                ? {
                      data: {
                          freeTripAvailable: false,
                          tripCredits: 0,
                          packages: [
                              { _id: "package-2", key: "two-trips", name: "2 AI trips", credits: 2, amountPaise: 14900 },
                          ],
                          payments: [],
                      },
                  }
                : { data: { destinations: [] } }
    ));

    render(
        <MemoryRouter initialEntries={[{
            pathname: "/dashboard",
            search: "?purchase=required",
        }]}>
            <Dashboard />
        </MemoryRouter>
    );

    const planPoster = await screen.findByRole("dialog", { name: /make room for more wonder/i });
    expect(within(planPoster).getByText("₹149")).toBeInTheDocument();
    expect(within(planPoster).getByRole("button", { name: /choose this pass/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ai trip credits/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Your free trip has been used.")).not.toBeInTheDocument();
});

test("opens trip passes from the navbar even when the free trip is still available", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/payments/account"
                ? {
                      data: {
                          freeTripAvailable: true,
                          tripCredits: 0,
                          packages: [
                              { _id: "package-1", key: "one-trip", name: "1 AI trip", credits: 1, amountPaise: 8900 },
                          ],
                          payments: [],
                      },
                  }
                : { data: { destinations: [] } }
    ));

    render(
        <MemoryRouter initialEntries={["/dashboard?plans=show"]}>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("dialog", { name: /make room for more wonder/i })).toBeInTheDocument();
    expect(screen.getByText(/add ai trip credits whenever you need them/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose this pass/i })).toBeInTheDocument();
});

test("opens Razorpay Test Mode checkout and verifies a successful payment", async () => {
    let paymentVerified = false;
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/payments/account"
                ? {
                      data: {
                          freeTripAvailable: false,
                          tripCredits: paymentVerified ? 1 : 0,
                          packages: [
                              { _id: "package-1", key: "one-trip", name: "1 AI trip", credits: 1, amountPaise: 8900 },
                          ],
                          payments: [],
                      },
                  }
                : { data: { destinations: [] } }
    ));
    api.post = jest.fn(async (path) => {
        if (path === "/payments/orders") {
            return {
                data: {
                    keyId: "rzp_test_demo",
                    amount: 8900,
                    currency: "INR",
                    orderId: "order_test_demo",
                    credits: 1,
                },
            };
        }
        if (path === "/payments/verify") {
            paymentVerified = true;
            return { data: { message: "Test payment verified and trip credits added." } };
        }
        throw new Error(`Unexpected payment request: ${path}`);
    });

    const checkoutOpen = jest.fn();
    window.Razorpay = jest.fn((options) => {
        window.checkoutOptions = options;
        return { on: jest.fn(), open: checkoutOpen };
    });

    render(
        <MemoryRouter initialEntries={["/dashboard?purchase=required"]}>
            <Dashboard />
        </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /choose this pass/i }));

    await waitFor(() => {
        expect(window.Razorpay).toHaveBeenCalledWith(expect.objectContaining({
            key: "rzp_test_demo",
            order_id: "order_test_demo",
            amount: 8900,
            currency: "INR",
        }));
    });
    expect(api.post).toHaveBeenCalledWith("/payments/orders", { packageKey: "one-trip" });
    expect(checkoutOpen).toHaveBeenCalled();

    const paymentResponse = {
        razorpay_order_id: "order_test_demo",
        razorpay_payment_id: "pay_test_demo",
        razorpay_signature: "test-signature",
    };
    await act(async () => {
        await window.checkoutOptions.handler(paymentResponse);
    });

    expect(api.post).toHaveBeenCalledWith("/payments/verify", paymentResponse);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/test payment verified/i);
});

test("lets the user minimize the plan poster to a side launcher and reopen it", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/payments/account"
                ? {
                      data: {
                          freeTripAvailable: false,
                          tripCredits: 0,
                          packages: [
                              { _id: "package-2", key: "two-trips", name: "2 AI trips", credits: 2, amountPaise: 14900 },
                          ],
                          payments: [],
                      },
                  }
                : { data: { destinations: [] } }
    ));

    const { unmount } = render(
        <MemoryRouter initialEntries={["/dashboard?purchase=required"]}>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("dialog", { name: /make room for more wonder/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /minimize subscription plans/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("tripai-plan-poster-minimized:taylor@example.com")).toBe("true");

    unmount();
    render(
        <MemoryRouter initialEntries={["/dashboard?purchase=required"]}>
            <Dashboard />
        </MemoryRouter>
    );
    expect(await screen.findByRole("button", { name: /reopen subscription plans/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reopen subscription plans/i }));
    expect(screen.getByRole("dialog", { name: /make room for more wonder/i })).toBeInTheDocument();
});

test("shows weather recommendations and lets a traveler mark an alert as read", async () => {
    const notification = {
        _id: "weather-1",
        trip: "trip-1",
        destination: "Reykjavik",
        tripDate: "2030-06-10",
        title: "Weather update for Reykjavik",
        message: "Forecast flags rain for 2030-06-10.",
        conditions: ["rain"],
        suggestions: ["Swap outdoor sightseeing for museums and covered markets."],
        affectedActivities: ["Outdoor walking tour"],
        read: false,
    };
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/payments/account"
                ? { data: { freeTripAvailable: true, tripCredits: 0, packages: [], payments: [] } }
                : path === "/notifications"
                    ? { data: { notifications: [notification] } }
                    : { data: { destinations: [] } }
    ));
    api.patch = jest.fn().mockResolvedValue({ data: { success: true } });

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Weather update for Reykjavik" })).toBeInTheDocument();
    expect(screen.getByText(/Outdoor plans to review: Outdoor walking tour/)).toBeInTheDocument();
    expect(screen.getByText(/Swap outdoor sightseeing for museums and covered markets/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mark as read/i }));

    await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith("/notifications/weather-1/read");
        expect(screen.queryByRole("button", { name: /mark as read/i })).not.toBeInTheDocument();
    });
});

test("shows personalized local destination recommendations and saves a place", async () => {
    let savedPlaces = [];
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/recommendations"
                ? {
                      data: {
                          source: "content-based",
                          profile: { savedPlaces },
                          recommendations: [{
                              name: "Varkala",
                              country: "India",
                              description: "Cliffside beaches and coastal trails.",
                              interests: ["beaches", "relaxation"],
                              estimatedTripBudget: 7500,
                              reason: "Matches your interest in beaches.",
                          }],
                      },
                  }
                : { data: { freeTripAvailable: true, packages: [], payments: [], destinations: [], invitations: [] } }
    ));
    api.post = jest.fn(async () => {
        savedPlaces = ["Varkala"];
        return { data: { saved: true, savedPlaces } };
    });

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Varkala" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Varkala destination" })).toHaveAttribute(
        "src",
        expect.stringContaining("photo-1512343879784-a960bf40e7f2")
    );
    expect(screen.getByText("Matches your interest in beaches.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save place/i }));

    await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/recommendations/saved-places", { destination: "Varkala" });
        expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
    });
});

test("shows the animated plan poster 30 seconds after the free trip is booked", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-23T12:00:00.000Z"));
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [{ _id: "trip-free", createdAt: new Date().toISOString() }] } }
            : path === "/payments/account"
                ? {
                      data: {
                          freeTripAvailable: false,
                          tripCredits: 0,
                          packages: [
                              { _id: "package-1", key: "one-trip", name: "1 AI trip", credits: 1, amountPaise: 8900 },
                          ],
                          payments: [],
                      },
                  }
                : { data: { destinations: [] } }
    ));

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
        jest.advanceTimersByTime(30 * 1000);
    });
    expect(screen.getByRole("dialog", { name: /make room for more wonder/i })).toBeInTheDocument();
});

test("shows the plan poster again immediately after previously purchased credits are exhausted", async () => {
    api.get.mockImplementation((path) => Promise.resolve(
        path === "/trips"
            ? { data: { trips: [] } }
            : path === "/payments/account"
                ? {
                      data: {
                          freeTripAvailable: false,
                          tripCredits: 0,
                          packages: [
                              { _id: "package-1", key: "one-trip", name: "1 AI trip", credits: 1, amountPaise: 8900 },
                          ],
                          payments: [{ _id: "payment-1", status: "paid" }],
                      },
                  }
                : { data: { destinations: [] } }
    ));

    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("dialog", { name: /make room for more wonder/i })).toBeInTheDocument();
});
