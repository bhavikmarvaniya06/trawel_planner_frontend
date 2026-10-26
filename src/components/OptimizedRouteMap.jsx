import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./OptimizedRouteMap.css";

const isValidLocation = (location) => (
    Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude)
);

function OptimizedRouteMap({ route, origin, stops }) {
    const mapElementRef = useRef(null);
    const [mapError, setMapError] = useState("");

    useEffect(() => {
        if (!route || !mapElementRef.current) return undefined;

        let map;
        let tileLayer;
        let cancelled = false;
        setMapError("");

        try {
            const path = route.coordinates
                .filter((coordinate) => (
                    Array.isArray(coordinate)
                    && coordinate.length === 2
                    && coordinate.every(Number.isFinite)
                ));
            if (!path.length) {
                setMapError("The route map did not receive any valid coordinates. Optimize the route again.");
                return undefined;
            }

            map = L.map(mapElementRef.current, {
                scrollWheelZoom: false,
                zoomControl: true,
            }).setView(path[0], 12);
            tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            });
            tileLayer.once("tileerror", () => {
                if (!cancelled) {
                    setMapError("OpenStreetMap tiles could not be loaded. Check your connection; route directions are still available.");
                }
            });
            tileLayer.addTo(map);

            L.polyline(path, {
                color: "#147466",
                opacity: 0.9,
                weight: 5,
            }).addTo(map);

            const waypoints = route.waypoints || [];
            const bounds = L.latLngBounds(path);
            waypoints.forEach((waypoint, index) => {
                if (!isValidLocation(waypoint.location)) return;
                const { latitude, longitude } = waypoint.location;
                const position = [latitude, longitude];
                bounds.extend(position);
                const label = index === 0 ? "S" : String(index);
                const icon = L.divIcon({
                    className: "optimized-route-map-marker-icon",
                    html: `<span>${label}</span>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                });
                const popup = document.createElement("span");
                popup.textContent = waypoint.name || (index === 0 ? origin : stops[index - 1]?.name) || "Route stop";
                L.marker(position, { icon }).addTo(map).bindPopup(popup);
            });

            if (bounds.isValid()) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
        } catch (error) {
            console.error("OpenStreetMap could not display the optimized route:", error);
            setMapError("The interactive map could not be displayed. You can still follow the route directions below.");
        }

        return () => {
            cancelled = true;
            if (map) map.remove();
        };
    }, [origin, route, stops]);

    return (
        <div className="optimized-route-map-wrap">
            {mapError && <p className="optimized-route-map-error" role="alert">{mapError}</p>}
            <div
                className="optimized-route-map"
                ref={mapElementRef}
                role="region"
                aria-label={`OpenStreetMap route from ${origin} through ${stops.map((stop) => stop.name).join(", ")}`}
            />
            <p className="optimized-route-map-attribution">
                Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>
            </p>
        </div>
    );
}

export default OptimizedRouteMap;
