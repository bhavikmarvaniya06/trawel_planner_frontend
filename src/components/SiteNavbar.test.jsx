import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

import SiteNavbar from "./SiteNavbar";

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({
        user: { name: "Bhavik H Marvaniya", role: "traveler" },
        logout: jest.fn(),
    }),
}));

function CurrentLocation() {
    const location = useLocation();
    return <output data-testid="current-location">{`${location.pathname}${location.search}`}</output>;
}

test("hides the account name and links the Trip Pass to travel plans", () => {
    render(
        <MemoryRouter>
            <SiteNavbar />
            <CurrentLocation />
        </MemoryRouter>
    );

    expect(screen.queryByText("Bhavik H Marvaniya")).not.toBeInTheDocument();
    const tripPassLinks = screen.getAllByRole("link", { name: /trip pass/i });
    expect(tripPassLinks).toHaveLength(1);
    expect(tripPassLinks[0]).toHaveAttribute("href", "/dashboard?plans=show");

    const navActions = document.querySelector(".site-nav-actions");
    expect(navActions.children[0]).toHaveClass("site-trip-pass-action");
    expect(navActions.children[1]).toHaveTextContent("Logout");

    fireEvent.click(tripPassLinks[0]);
    expect(screen.getByTestId("current-location")).toHaveTextContent("/dashboard?plans=show");
});
