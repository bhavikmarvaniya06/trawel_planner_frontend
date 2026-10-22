import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Users,
    Wallet,
    MapPin,
    Sparkles,
    Mail,
} from "lucide-react";

import api from "../services/api";
import SiteNavbar from "../components/SiteNavbar";

import "./TripDetails.css";


function TripDetails() {

    const { id } = useParams();

    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [emailSending, setEmailSending] = useState(false);
    const [emailMessage, setEmailMessage] = useState("");
    const [emailError, setEmailError] = useState("");


    useEffect(() => {

        const fetchTrip = async () => {

            try {

                const response = await api.get(
                    `/trips/${id}`
                );

                setTrip(response.data.trip);

            } catch (error) {

                console.error(
                    "Trip details error:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load trip"
                );

            } finally {

                setLoading(false);

            }
        };


        fetchTrip();

    }, [id]);

    const handleEmailTripPdf = async () => {
        setEmailSending(true);
        setEmailMessage("");
        setEmailError("");

        try {
            const response = await api.post(`/trips/${id}/email`);
            setEmailMessage(response.data.message || "Trip PDF sent to your login email.");
        } catch (emailRequestError) {
            setEmailError(
                emailRequestError.response?.data?.message ||
                "Unable to send the trip PDF. Check your backend email settings."
            );
        } finally {
            setEmailSending(false);
        }
    };


    const formatDate = (date) => {

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );

    };


    if (loading) {
        return (
            <div className="trip-loading">
                Loading trip...
            </div>
        );
    }


    if (error) {
        return (
            <div className="trip-error">
                <h2>{error}</h2>

                <button
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }


    return (

        <div className="trip-details-page">


            <SiteNavbar />

            {/* Hero */}

            <section className="trip-hero">

                <button
                    className="back-btn"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    <ArrowLeft size={18} />
                    Back
                </button>


                <div className="trip-hero-content">

                    <div className="trip-location">

                        <MapPin size={20} />

                        Your Trip

                    </div>


                    <h1>
                        {trip.destination}
                    </h1>


                    <p>
                        {formatDate(trip.startDate)}
                        {" - "}
                        {formatDate(trip.endDate)}
                    </p>

                </div>

                <div className="trip-email-action">
                    <button type="button" onClick={handleEmailTripPdf} disabled={emailSending}>
                        <Mail size={17} />
                        {emailSending ? "Sending PDF..." : "Email trip PDF"}
                    </button>
                    {emailMessage && <p role="status">{emailMessage}</p>}
                    {emailError && <p role="alert">{emailError}</p>}
                </div>

            </section>



            {/* Details */}

            <main className="trip-details-container">


                <div className="trip-info-grid">


                    <div className="trip-info-card">

                        <CalendarDays size={22} />

                        <span>
                            Travel Dates
                        </span>

                        <strong>
                            {formatDate(trip.startDate)}
                            {" - "}
                            {formatDate(trip.endDate)}
                        </strong>

                    </div>



                    <div className="trip-info-card">

                        <Users size={22} />

                        <span>
                            Travelers
                        </span>

                        <strong>
                            {trip.travelers}
                        </strong>

                    </div>



                    <div className="trip-info-card">

                        <Wallet size={22} />

                        <span>
                            Budget
                        </span>

                        <strong>
                            ₹{Number(
                                trip.budget
                            ).toLocaleString("en-IN")}
                        </strong>

                    </div>

                </div>



                {/* Preferences */}

                <section className="trip-preferences">

                    <h2>
                        Trip Preferences
                    </h2>


                    <div className="preference-row">

                        <strong>
                            Travel Style
                        </strong>

                        <span>
                            {trip.travelStyle}
                        </span>

                    </div>


                    <div className="preference-row">

                        <strong>
                            Interests
                        </strong>


                        <div className="trip-tags">

                            {trip.interests?.map(
                                (interest) => (
                                    <span key={interest}>
                                        {interest}
                                    </span>
                                )
                            )}

                        </div>

                    </div>

                </section>



                {/* AI Section */}

                <section className="itinerary-section">
                    <div className="ai-itinerary-card">
                        <div className="ai-icon">
                            <Sparkles size={26} />
                        </div>
                        <div>
                            <h2>Your Trip Itinerary</h2>
                            <p>A day-by-day plan tailored to your trip.</p>
                        </div>
                    </div>

                    {trip.itinerary?.length ? (
                        <div className="itinerary-days">
                            {trip.itinerary.map((day, index) => (
                                <article className="itinerary-day" key={`${day.date}-${index}`}>
                                    <div className="itinerary-day-heading">
                                        <div>
                                            <span>DAY {day.day || index + 1}</span>
                                            <h3>{day.title}</h3>
                                            {day.date && <p>{formatDate(day.date)}</p>}
                                        </div>
                                        {day.estimatedCost !== null && day.estimatedCost !== undefined && (
                                            <strong>₹{Number(day.estimatedCost).toLocaleString("en-IN")}</strong>
                                        )}
                                    </div>
                                    <ol className="itinerary-schedule">
                                        {day.activities?.map((activity, activityIndex) => {
                                            const item = typeof activity === "string"
                                                ? { title: activity, description: "", time: "", location: "" }
                                                : activity;

                                            return (
                                                <li key={`${item.title}-${activityIndex}`}>
                                                    <div className="itinerary-activity-meta">
                                                        {item.time && <time>{item.time}</time>}
                                                        {item.type && <span>{item.type}</span>}
                                                    </div>
                                                    <h4>{item.title}</h4>
                                                    {item.description && <p>{item.description}</p>}
                                                    {item.location && (
                                                        <a
                                                            className="itinerary-map-link"
                                                            href={item.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <MapPin size={15} />
                                                            {item.location}
                                                        </a>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                    {day.sources?.length > 0 && (
                                        <div className="itinerary-sources">
                                            Sources: {day.sources.map((source, sourceIndex) => (
                                                <a
                                                    href={source.url}
                                                    key={`${source.url}-${sourceIndex}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {source.name} guide
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="itinerary-empty">No itinerary is saved for this trip.</p>
                    )}
                </section>


            </main>

        </div>

    );
}


export default TripDetails;