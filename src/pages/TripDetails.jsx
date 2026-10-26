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
    CloudSun,
    CloudRain,
    Wind,
    ThermometerSun,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import SiteNavbar from "../components/SiteNavbar";

import "./TripDetails.css";


function TripDetails() {

    const { id } = useParams();

    const navigate = useNavigate();
    const { user } = useAuth();
    const [trip, setTrip] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [emailSending, setEmailSending] = useState(false);
    const [emailMessage, setEmailMessage] = useState("");
    const [emailError, setEmailError] = useState("");
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState("");

    const ownerId = typeof trip?.user === "string" ? trip.user : trip?.user?._id;
    const currentUserId = user?._id || user?.id;
    const isTripOwner = Boolean(ownerId && currentUserId && String(ownerId) === String(currentUserId));


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

    }, [id, currentUserId]);

    useEffect(() => {
        let active = true;
        setWeather(null);
        setWeatherLoading(true);
        setWeatherError("");
        api.get(`/trips/${id}/weather`)
            .then((response) => {
                if (active) setWeather(response.data);
            })
            .catch((requestError) => {
                console.error("Unable to load trip weather:", requestError);
                if (active) {
                    setWeatherError(
                        requestError.response?.data?.message ||
                        "Weather data is temporarily unavailable. Please try again."
                    );
                }
            })
            .finally(() => {
                if (active) setWeatherLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id]);

    const handleRefreshWeather = async () => {
        setWeatherLoading(true);
        setWeatherError("");
        try {
            const response = await api.get(`/trips/${id}/weather`);
            setWeather(response.data);
        } catch (requestError) {
            console.error("Unable to refresh trip weather:", requestError);
            setWeatherError(
                requestError.response?.data?.message ||
                "Weather data is temporarily unavailable. Please try again."
            );
        } finally {
            setWeatherLoading(false);
        }
    };

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

    const formatWeatherDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(
        "en-IN",
        { weekday: "short", day: "numeric", month: "short" }
    );

    const describeWeather = (code) => {
        const descriptions = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Rime fog",
            51: "Light drizzle",
            53: "Drizzle",
            55: "Heavy drizzle",
            61: "Light rain",
            63: "Rain",
            65: "Heavy rain",
            71: "Light snow",
            73: "Snow",
            75: "Heavy snow",
            80: "Rain showers",
            81: "Rain showers",
            82: "Heavy rain showers",
            95: "Thunderstorm",
            96: "Thunderstorm with hail",
            99: "Thunderstorm with hail",
        };
        return descriptions[code] || "Forecast available";
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

                {isTripOwner && (
                    <div className="trip-email-action">
                        <button type="button" onClick={handleEmailTripPdf} disabled={emailSending}>
                            <Mail size={17} />
                            {emailSending ? "Sending PDF..." : "Email trip PDF"}
                        </button>
                        {emailMessage && <p role="status">{emailMessage}</p>}
                        {emailError && <p role="alert">{emailError}</p>}
                    </div>
                )}

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

                <section className="trip-weather-section" aria-label="Trip weather forecast">
                    <div className="trip-weather-heading">
                        <div>
                            <span className="trip-weather-icon"><CloudSun size={22} /></span>
                            <div>
                                <p>{weather?.forecastType === "historical" ? "HISTORICAL WEATHER" : "OPEN-METEO FORECAST"}</p>
                                <h2>Weather in {trip.destination}</h2>
                                {weather?.weatherLocation && weather.weatherLocation.toLowerCase() !== trip.destination.toLowerCase() && (
                                    <span className="trip-weather-location">Based on {weather.weatherLocation}</span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="trip-weather-refresh"
                            onClick={handleRefreshWeather}
                            disabled={weatherLoading}
                        >
                            <RefreshCw size={16} className={weatherLoading ? "is-spinning" : ""} />
                            {weatherLoading ? "Checking..." : "Refresh"}
                        </button>
                    </div>

                    {weatherError && <p className="trip-weather-error" role="alert">{weatherError}</p>}
                    {weatherLoading && !weather && <p className="trip-weather-message" role="status">Loading the forecast for your trip...</p>}
                    {!weatherLoading && !weatherError && weather && !weather.forecastAvailable && (
                        <p className="trip-weather-message" role="status">{weather.message}</p>
                    )}
                    {!weatherLoading && !weatherError && weather?.forecastAvailable && weather.forecast?.length > 0 && (
                        <>
                            <div className="trip-weather-grid">
                                {weather.forecast.map((day) => (
                                    <article className="trip-weather-day" key={day.date}>
                                        <div className="trip-weather-day-heading">
                                            <span>{formatWeatherDate(day.date)}</span>
                                            {day.conditions?.length > 0 && <AlertTriangle size={17} aria-label="Weather alert" />}
                                        </div>
                                        <h3>{describeWeather(day.weatherCode)}</h3>
                                        <div className="trip-weather-metrics">
                                            <span><ThermometerSun size={16} /> {day.temperatureMin ?? "—"}° / {day.temperatureMax ?? "—"}°C</span>
                                            <span>
                                                <CloudRain size={16} />
                                                {day.precipitationProbability === null || day.precipitationProbability === undefined
                                                    ? `${day.precipitation ?? "—"} mm precipitation`
                                                    : `${day.precipitationProbability}% rain chance`}
                                            </span>
                                            <span><Wind size={16} /> {day.windSpeed ?? "—"} km/h</span>
                                        </div>
                                        {day.conditions?.length > 0 ? (
                                            <div className="trip-weather-alert">
                                                <strong>Plan for {day.conditions.join(", ")}</strong>
                                                {day.suggestions?.map((suggestion) => (
                                                    <p key={suggestion}>{suggestion}</p>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="trip-weather-clear">No significant weather risks expected.</p>
                                        )}
                                    </article>
                                ))}
                            </div>
                            {weather.forecastThrough && new Date(`${weather.forecastThrough}T00:00:00`) < new Date(trip.endDate) && (
                                <p className="trip-weather-message">
                                    Forecasts are currently available through {formatWeatherDate(weather.forecastThrough)}. Check back for the remaining trip days.
                                </p>
                            )}
                        </>
                    )}
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
                                                            href={item.mapsUrl || `https://www.openstreetmap.org/search?query=${encodeURIComponent(item.location)}`}
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