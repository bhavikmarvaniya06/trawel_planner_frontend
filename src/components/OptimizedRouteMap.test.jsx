import { render, screen, waitFor } from "@testing-library/react";
import L from "leaflet";

import OptimizedRouteMap from "./OptimizedRouteMap";

const mapInstance = {
    setView: jest.fn(),
    fitBounds: jest.fn(),
    remove: jest.fn(),
};
const tileLayer = {
    once: jest.fn(),
    addTo: jest.fn(),
};
const polyline = { addTo: jest.fn() };
const bounds = { extend: jest.fn(), isValid: jest.fn(() => true) };
const marker = { addTo: jest.fn(), bindPopup: jest.fn() };

beforeEach(() => {
    mapInstance.setView.mockReturnValue(mapInstance);
    tileLayer.once.mockReturnValue(tileLayer);
    tileLayer.addTo.mockReturnValue(tileLayer);
    polyline.addTo.mockReturnValue(polyline);
    marker.addTo.mockReturnValue(marker);
    marker.bindPopup.mockReturnValue(marker);
    jest.spyOn(L, "map").mockReturnValue(mapInstance);
    jest.spyOn(L, "tileLayer").mockReturnValue(tileLayer);
    jest.spyOn(L, "polyline").mockReturnValue(polyline);
    jest.spyOn(L, "latLngBounds").mockReturnValue(bounds);
    jest.spyOn(L, "divIcon").mockImplementation((options) => options);
    jest.spyOn(L, "marker").mockReturnValue(marker);
});

afterEach(() => {
    jest.restoreAllMocks();
});

test("renders an attributed OpenStreetMap with the optimized line and numbered stops", async () => {
    const route = {
        coordinates: [[15, 73], [15.1, 73.1], [15.2, 73.2]],
        waypoints: [
            { name: "Goa", location: { latitude: 15, longitude: 73 } },
            { name: "Fontainhas", location: { latitude: 15.1, longitude: 73.1 } },
            { name: "Fort Aguada", location: { latitude: 15.2, longitude: 73.2 } },
        ],
    };
    const { unmount } = render(
        <OptimizedRouteMap
            route={route}
            origin="Goa"
            stops={[{ name: "Fontainhas", order: 1 }, { name: "Fort Aguada", order: 2 }]}
        />
    );

    expect(screen.getByRole("region", { name: /openstreetmap route from goa/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /openstreetmap contributors/i })).toHaveAttribute(
        "href",
        "https://www.openstreetmap.org/copyright"
    );
    await waitFor(() => expect(L.map).toHaveBeenCalledTimes(1));
    expect(L.tileLayer).toHaveBeenCalledWith(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        expect.objectContaining({ maxZoom: 19 })
    );
    expect(L.polyline).toHaveBeenCalledWith(route.coordinates, expect.objectContaining({ color: "#147466" }));
    expect(L.marker).toHaveBeenCalledTimes(3);
    expect(L.divIcon).toHaveBeenNthCalledWith(1, expect.objectContaining({ html: "<span>S</span>" }));
    expect(L.divIcon).toHaveBeenNthCalledWith(2, expect.objectContaining({ html: "<span>1</span>" }));
    expect(L.divIcon).toHaveBeenNthCalledWith(3, expect.objectContaining({ html: "<span>2</span>" }));

    unmount();
    expect(mapInstance.remove).toHaveBeenCalled();
});

test("shows a graceful message when route geometry is unavailable", async () => {
    render(<OptimizedRouteMap route={{ coordinates: [] }} origin="Goa" stops={[]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/did not receive any valid coordinates/i);
});
