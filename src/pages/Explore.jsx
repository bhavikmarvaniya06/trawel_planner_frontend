import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    MapPin,
    ArrowRight,
    Search,
    CalendarDays,
    Wallet,
} from "lucide-react";

import SiteNavbar from "../components/SiteNavbar";
import api, { getApiResourceUrl } from "../services/api";
import destinations, { destinationFallbackImage, getDestinationImage } from "../data/destinations";
import "./Explore.css";


function Explore() {
    const [adminDestinations, setAdminDestinations] = useState([]);
    const [catalogError, setCatalogError] = useState("");
    const [activeImages, setActiveImages] = useState({});

    useEffect(() => {
        const loadAdminDestinations = async () => {
            try {
                const response = await api.get("/destinations");
                setAdminDestinations(response.data.destinations || []);
            } catch (requestError) {
                console.error("Failed to fetch featured destinations:", requestError);
                setCatalogError(
                    requestError.response?.data?.message || "Unable to load featured destinations"
                );
            }
        };

        loadAdminDestinations();
    }, []);

    const adminDestinationNames = new Set(
        adminDestinations.map((destination) => destination.name.trim().toLowerCase())
    );
    const filteredDestinations = [
        ...adminDestinations.map((destination) => ({
            ...destination,
            image: getDestinationImage(
                destination.name,
                destination.images?.[0]?.url
                    ? getApiResourceUrl(destination.images[0].url)
                    : destination.imageUrl
            ),
        })),
        ...destinations.filter(
            (destination) => !adminDestinationNames.has(destination.name.trim().toLowerCase())
        ),
    ];


    return (

        <div className="explore-page">


            <SiteNavbar />


            {/* HERO */}

            <section className="explore-hero">

                <div className="explore-hero-content">

                    <div className="explore-badge">

                        <Search size={16} />

                        EXPLORE THE WORLD

                    </div>


                    <h1>
                        Discover your next adventure
                    </h1>


                    <p>
                        Explore amazing destinations and let
                        TripAI help you create the perfect trip.
                    </p>

                    <Link
                        to="/planner"
                        className="explore-cta"
                    >
                        Plan My Trip
                        <ArrowRight size={18} />
                    </Link>

                </div>

            </section>



            {/* DESTINATIONS */}

            <section className="destinations-section">

                <div className="explore-section-header">

                    <div>

                        <p>
                            POPULAR DESTINATIONS
                        </p>

                        <h2>
                            Where will you go next?
                        </h2>

                    </div>

                </div>

                {catalogError && <p className="explore-catalog-error" role="alert">{catalogError}</p>}

                <div className="destination-grid">

                    {filteredDestinations.map((destination) => (

                        <div
                            className="destination-card"
                            key={destination._id || destination.name}
                        >

                            <div className="destination-image">
                                <img
                                    src={destination.images?.[activeImages[destination._id] || 0]?.url
                                        ? getApiResourceUrl(destination.images[activeImages[destination._id] || 0].url)
                                        : destination.image}
                                    alt={destination.name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(event) => {
                                        if (!event.currentTarget.src.endsWith(destinationFallbackImage)) {
                                            event.currentTarget.src = destinationFallbackImage;
                                        }
                                    }}
                                />
                                <h3 className="destination-image-title">{destination.name}</h3>
                                {destination.imageCredit && (
                                    <a
                                        className="destination-image-credit"
                                        href={destination.imageCredit.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {destination.imageCredit.label}
                                    </a>
                                )}
                                {destination.images?.length > 1 && (
                                    <div className="destination-image-count" aria-label={`${destination.images.length} photos`}>
                                        {destination.images.length} photos
                                    </div>
                                )}
                            </div>


                            <div className="destination-content">

                                <div className="destination-location">

                                    <MapPin size={16} />

                                    {destination.name},{" "}
                                    {destination.country}

                                </div>


                                <p>
                                    {destination.description}
                                </p>

                                {destination.images?.length > 1 && (
                                    <div className="destination-gallery" aria-label={`${destination.name} photos`}>
                                        {destination.images.map((image, index) => (
                                            <button
                                                type="button"
                                                key={image._id || image.url}
                                                className={(activeImages[destination._id] || 0) === index ? "active" : ""}
                                                onClick={() => {
                                                    setActiveImages((current) => ({
                                                        ...current,
                                                        [destination._id]: index,
                                                    }));
                                                }}
                                                aria-label={`Show ${destination.name} photo ${index + 1}`}
                                                aria-pressed={(activeImages[destination._id] || 0) === index}
                                            >
                                                <img src={getApiResourceUrl(image.url)} alt="" loading="lazy" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {(destination.durationDays || Number.isFinite(Number(destination.price))) && (
                                    <div className="destination-package-facts">
                                        {destination.durationDays > 0 && (
                                            <span><CalendarDays size={15} /> {destination.durationDays} days</span>
                                        )}
                                        {destination.price !== undefined && (
                                            <span><Wallet size={15} /> {destination.currency || "USD"} {Number(destination.price).toLocaleString()}</span>
                                        )}
                                    </div>
                                )}

                                {destination.itinerary?.length > 0 && (
                                    <details className="destination-itinerary">
                                        <summary>View {destination.itinerary.length}-day itinerary</summary>
                                        <ol>
                                            {destination.itinerary.map((day) => (
                                                <li key={day.day}>
                                                    <strong>Day {day.day}: {day.title}</strong>
                                                    {day.description && <p>{day.description}</p>}
                                                    {day.activities?.length > 0 && <span>{day.activities.join(" · ")}</span>}
                                                </li>
                                            ))}
                                        </ol>
                                    </details>
                                )}

                                {destination.bookingDetails && (
                                    <div className="destination-booking-details">
                                        {destination.bookingDetails.notes && <p>{destination.bookingDetails.notes}</p>}
                                        {destination.bookingDetails.contactPhone && (
                                            <a href={`tel:${destination.bookingDetails.contactPhone}`}>
                                                {destination.bookingDetails.contactPhone}
                                            </a>
                                        )}
                                        {destination.bookingDetails.contactEmail && (
                                            <a href={`mailto:${destination.bookingDetails.contactEmail}`}>
                                                {destination.bookingDetails.contactEmail}
                                            </a>
                                        )}
                                        {destination.bookingDetails.bookingUrl && (
                                            <a href={destination.bookingDetails.bookingUrl} target="_blank" rel="noreferrer">
                                                Provider booking details
                                            </a>
                                        )}
                                    </div>
                                )}

                                <Link
                                    to={`/planner?destination=${encodeURIComponent(destination.name)}`}
                                    className="destination-link"
                                >
                                    Plan a trip
                                    <ArrowRight size={16} />
                                </Link>

                                {destination._id && (
                                    <>
                                        <Link
                                            to={`/planner?destinationPackageId=${encodeURIComponent(destination._id)}`}
                                            className={`destination-link${destination.bookingDetails?.available === false ? " is-unavailable" : ""}`}
                                            aria-disabled={destination.bookingDetails?.available === false}
                                            onClick={(event) => {
                                                if (destination.bookingDetails?.available === false) event.preventDefault();
                                            }}
                                        >
                                            {destination.bookingDetails?.available === false ? "Currently unavailable" : "Book Now"}
                                            {destination.bookingDetails?.available !== false && <ArrowRight size={16} />}
                                        </Link>
                                        <small className="destination-booking-note">
                                            Continues to your TripAI planner and uses your existing trip-credit rules.
                                        </small>
                                    </>
                                )}

                            </div>

                        </div>

                    ))}

                </div>
            </section>



            {/* CTA */}

            <section className="explore-bottom">

                <h2>
                    Don't know where to go?
                </h2>

                <p>
                    Let our AI create a destination and itinerary
                    based on your preferences.
                </p>


                <Link
                    to="/planner"
                    className="explore-cta"
                >
                    Try AI Planner
                    <ArrowRight size={18} />
                </Link>

            </section>


        </div>

    );

}


export default Explore;