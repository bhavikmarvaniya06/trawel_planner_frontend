import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import api from "../services/api";
import Explore from "./Explore";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
    getApiResourceUrl: (path) => `https://api.example.com${path}`,
}));

jest.mock("../components/SiteNavbar", () => () => <nav>TripAI</nav>);

afterEach(() => {
    jest.clearAllMocks();
});

test("renders published destination package details and its Planner link", async () => {
    api.get.mockResolvedValue({
        data: {
            destinations: [{
                _id: "destination-1",
                name: "Lake District",
                country: "India",
                description: "A curated lakeside escape.",
                price: 1500,
                currency: "INR",
                durationDays: 3,
                itinerary: [{ day: 1, title: "Arrival", activities: ["Check in"] }],
                bookingDetails: {
                    available: true,
                    notes: "Seasonal availability.",
                },
                images: [{
                    _id: "image-1",
                    url: "/api/destinations/destination-1/images/image-1",
                }],
            }],
        },
    });

    render(
        <MemoryRouter>
            <Explore />
        </MemoryRouter>
    );

    expect(await screen.findByText("Lake District")).toBeInTheDocument();
    expect(screen.getByText(/INR 1,500/)).toBeInTheDocument();
    expect(screen.getByText("3 days")).toBeInTheDocument();
    expect(screen.getByText("Seasonal availability.")).toBeInTheDocument();
    expect(screen.getByText("Day 1: Arrival")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book Now" })).toHaveAttribute(
        "href",
        "/planner?destinationPackageId=destination-1"
    );
    expect(screen.getAllByRole("link", { name: "Plan a trip" }).find(
        (link) => link.getAttribute("href") === "/planner?destination=Lake%20District"
    )).toHaveAttribute(
        "href",
        "/planner?destination=Lake%20District"
    );
    expect(screen.getByRole("img", { name: "Lake District" })).toHaveAttribute(
        "src",
        "https://api.example.com/api/destinations/destination-1/images/image-1"
    );
});

test("provides a direct planner link for every featured destination", async () => {
    api.get.mockResolvedValue({ data: { destinations: [] } });

    render(
        <MemoryRouter>
            <Explore />
        </MemoryRouter>
    );

    await screen.findByText("Where will you go next?");
    const planLinks = screen.getAllByRole("link", { name: "Plan a trip" });
    expect(planLinks).toHaveLength(44);
    expect(planLinks.find((link) => link.getAttribute("href") === "/planner?destination=Bali")).toHaveAttribute(
        "href",
        "/planner?destination=Bali"
    );
});
