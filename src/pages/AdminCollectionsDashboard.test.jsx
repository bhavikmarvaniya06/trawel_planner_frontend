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
    useAuth: () => ({ logout: jest.fn() }),
}));

test("admin can use Gemini to draft and save a location in the destinations table", async () => {
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
    api.post.mockImplementation((path) => Promise.resolve(
        path === "/admin/destinations/ai-description"
            ? { data: { description: "A scenic coastal city known for its historic waterfront." } }
            : {
                  data: {
                      destination: {
                          _id: "location-1",
                          name: "Harbor City",
                          country: "Example",
                          region: "Coast",
                          description: "A scenic coastal city known for its historic waterfront.",
                          imageUrl: "https://example.com/harbor.jpg",
                          imageCredit: { label: "", url: "" },
                          active: true,
                      },
                  },
              }
    ));

    render(
        <MemoryRouter>
            <AdminCollectionsDashboard />
        </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /^Destinations/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add location" }));
    fireEvent.change(screen.getByLabelText("Location name"), { target: { value: "Harbor City" } });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "Example" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "Coast" } });
    fireEvent.click(screen.getByRole("button", { name: /draft with gemini/i }));

    expect(await screen.findByLabelText("Description")).toHaveValue(
        "A scenic coastal city known for its historic waterfront."
    );
    fireEvent.change(screen.getByLabelText("Image URL (HTTP or HTTPS)"), {
        target: { value: "https://example.com/harbor.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
        "/admin/destinations",
        expect.objectContaining({
            name: "Harbor City",
            description: "A scenic coastal city known for its historic waterfront.",
            imageUrl: "https://example.com/harbor.jpg",
        })
    ));
    expect(await screen.findByText("Harbor City")).toBeInTheDocument();
});