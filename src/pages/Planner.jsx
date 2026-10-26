import { useCallback, useEffect, useRef, useState } from "react";
import {
    MapPin,
    CalendarDays,
    Users,
    Wallet,
    Sparkles,
    ArrowRight,
    Compass,
    Utensils,
    Trees,
    ShoppingBag,
    Landmark,
    Route,
} from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SiteNavbar from "../components/SiteNavbar";
import OptimizedRouteMap from "../components/OptimizedRouteMap";

import "./Planner.css";


function Planner() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === "admin") {
            navigate("/admin", { replace: true });
        }
    }, [user, navigate]);

    // ============================
    // INTERESTS
    // ============================

    const [interests, setInterests] = useState([]);


    // ============================
    // FORM STATE
    // ============================

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");
    const [destination, setDestination] = useState(() => searchParams.get("destination") || "");
    const [destinationPackage, setDestinationPackage] = useState(null);
    const [destinationPackageLoading, setDestinationPackageLoading] = useState(
        () => Boolean(searchParams.get("destinationPackageId"))
    );
    const [tripDays, setTripDays] = useState("");
    const [travelerCount, setTravelerCount] = useState("2");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionType, setSuggestionType] = useState("");
    const [suggestionSource, setSuggestionSource] = useState("");
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [findingSuggestions, setFindingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState("");
    const [budgetInput, setBudgetInput] = useState("");
    const [travelStyle, setTravelStyle] = useState("balanced");
    const [routeObjective, setRouteObjective] = useState("balanced");
    const [optimizingRoute, setOptimizingRoute] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState(null);
    const [routeError, setRouteError] = useState("");
    const formRef = useRef(null);
    const suggestionRequestRef = useRef(0);
    const routeRequestRef = useRef(0);
    const destinationPackageId = searchParams.get("destinationPackageId");

    const invalidateOptimizedRoute = () => {
        routeRequestRef.current += 1;
        setOptimizingRoute(false);
        setOptimizedRoute(null);
        setRouteError("");
    };

    useEffect(() => {
        if (!destinationPackageId) {
            setDestinationPackage(null);
            setDestinationPackageLoading(false);
            return undefined;
        }

        let active = true;
        setDestinationPackageLoading(true);
        api.get(`/destinations/${encodeURIComponent(destinationPackageId)}`)
            .then((response) => {
                if (!active) return;
                const packageDetails = response.data.destination;
                setDestinationPackage(packageDetails);
                setDestination(packageDetails.name);
                setTripDays(String(packageDetails.durationDays));
                setTravelerCount("1");
                setBudgetInput(String(Number(packageDetails.price) || 0));
                setError("");
            })
            .catch((requestError) => {
                if (!active) return;
                setDestinationPackage(null);
                setError(
                    requestError.response?.data?.message
                    || "This destination package is no longer available."
                );
            })
            .finally(() => {
                if (active) setDestinationPackageLoading(false);
            });

        return () => {
            active = false;
        };
    }, [destinationPackageId]);


    // ============================
    // INTEREST OPTIONS
    // ============================

    const interestOptions = [
        {
            name: "Beaches",
            icon: <Compass size={18} />,
        },
        {
            name: "Food",
            icon: <Utensils size={18} />,
        },
        {
            name: "Nature",
            icon: <Trees size={18} />,
        },
        {
            name: "Shopping",
            icon: <ShoppingBag size={18} />,
        },
        {
            name: "History",
            icon: <Landmark size={18} />,
        },
        {
            name: "Luxury events",
            icon: <CalendarDays size={18} />,
        },
    ];


    // ============================
    // TOGGLE INTEREST
    // ============================

    const toggleInterest = (interest) => {

        if (interests.includes(interest)) {

            setInterests(
                interests.filter(
                    (item) => item !== interest
                )
            );

        } else {

            setInterests([
                ...interests,
                interest,
            ]);

        }
    };

    const findSuggestions = useCallback(async (destinationQuery = destination) => {
        const requestId = ++suggestionRequestRef.current;
        setSuggestionError("");
        setSuggestions([]);
        setSuggestionSource("");
        setFindingSuggestions(true);

        try {
            const response = await api.post("/trips/suggestions", {
                destination: destinationQuery.trim(),
                days: Number(tripDays) || 3,
                interests,
                travelStyle,
                budget: Number(budgetInput) || undefined,
            });

            if (requestId === suggestionRequestRef.current) {
                setSuggestions(response.data.suggestions);
                setSuggestionType(response.data.type);
                setSuggestionSource(response.data.source || "wikivoyage");
            }
        } catch (requestError) {
            if (requestId === suggestionRequestRef.current) {
                setSuggestionError(
                    requestError.response?.data?.message ||
                    (requestError.response
                        ? "Could not find travel ideas. Please try again."
                        : "Cannot reach the TripAI server. Check that the backend is running and the API URL is correct.")
                );
            }
        } finally {
            if (requestId === suggestionRequestRef.current) {
                setFindingSuggestions(false);
            }
        }
    }, [budgetInput, destination, interests, travelStyle, tripDays]);

    useEffect(() => {
        const days = Number(tripDays) || (destination.trim() ? 3 : 0);

        if (!Number.isInteger(days) || days < 1 || days > 30) {
            return undefined;
        }

        const timeout = setTimeout(() => findSuggestions(), 800);
        return () => clearTimeout(timeout);
    }, [destination, findSuggestions, tripDays]);

    const selectSuggestion = (suggestion) => {
        invalidateOptimizedRoute();
        if (suggestionType === "destinations") {
            setDestination(suggestion.name);
            setSelectedPlaces([]);
            return;
        }

        setSelectedPlaces((current) => {
            return current.includes(suggestion.name)
                ? current.filter((place) => place !== suggestion.name)
                : [...current, suggestion.name];
        });
    };

    const optimizeSelectedRoute = async () => {
        if (!destination.trim()) {
            setRouteError("Enter your trip destination first so we know where the route starts.");
            return;
        }

        const requestId = ++routeRequestRef.current;
        setRouteError("");
        setOptimizedRoute(null);
        setOptimizingRoute(true);
        try {
            const response = await api.post("/trips/optimize-route", {
                origin: destination.trim(),
                stops: selectedPlaces,
                travelMode: "DRIVE",
                objective: routeObjective,
            });
            if (requestId === routeRequestRef.current) {
                setSelectedPlaces(response.data.stops.map((stop) => stop.name));
                setOptimizedRoute(response.data);
            }
        } catch (requestError) {
            console.error("Route optimization error:", requestError);
            if (requestId === routeRequestRef.current) {
                setRouteError(
                    requestError.response?.data?.message
                    || "Unable to optimize this route. Check your connection and try again."
                );
            }
        } finally {
            if (requestId === routeRequestRef.current) setOptimizingRoute(false);
        }
    };

    const formatRouteDistance = (meters) => (
        `${(Number(meters || 0) / 1000).toLocaleString("en-IN", {
            maximumFractionDigits: 1,
        })} km`
    );

    const formatRouteDuration = (seconds) => {
        const totalMinutes = Math.round(Number(seconds || 0) / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes} min`;
        return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
    };

    const formatRouteCost = (amount) => `₹${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;

    const getOpenStreetMapDirectionsUrl = (route) => {
        const waypoints = route.route.waypoints
            .filter((waypoint) => waypoint.location)
            .map(({ location }) => `${location.latitude},${location.longitude}`)
            .join(";");
        const query = new URLSearchParams({
            engine: "fossgis_osrm_car",
            route: waypoints,
        });
        return `https://www.openstreetmap.org/directions?${query.toString()}`;
    };


    // ============================
    // SUBMIT FORM
    // ============================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");
        setSaving(true);


        try {

            const form = e.target;
            const readFormValue = (name) => form.elements.namedItem(name)?.value || "";
            const startDate = readFormValue("startDate");
            const days = Number(readFormValue("days"));
            const endDate = new Date(`${startDate}T00:00:00.000Z`);
            endDate.setUTCDate(endDate.getUTCDate() + days - 1);

            if (!destination.trim()) {
                setError("Enter a destination or choose an AI destination suggestion.");
                return;
            }


            // Get form values
            const tripData = {

                destination: destination.trim(),

                startDate,

                endDate: endDate.toISOString().slice(0, 10),

                places: selectedPlaces,

                travelers:
                    Number(readFormValue("travelers")),

                budget:
                    Number(readFormValue("budget")),

                travelStyle:
                    readFormValue("travelStyle"),

                interests:
                    interests,

            };
            if (destinationPackage) {
                tripData.destinationPackageId = destinationPackage._id;
            }


            // ============================
            // BASIC VALIDATION
            // ============================

            // ============================
            // SEND TO BACKEND
            // ============================

            const planResponse = destinationPackage
                ? null
                : await api.post("/ai/plan", tripData);
            const response = await api.post("/trips", {
                ...tripData,
                ...(planResponse ? { itinerary: planResponse.data.itinerary } : {}),
            });


            console.log(
                "Trip saved:",
                response.data
            );


            // ============================
            // SUCCESS
            // ============================

            const planMessage = destinationPackage
                ? "Your destination package trip is saved!"
                : planResponse.data.generatedBy === "wikivoyage"
                    ? "Your guide-based itinerary is ready!"
                    : "Your AI itinerary is ready!";
            setSuccess(`${planMessage} ${response.data.emailMessage || ""}`.trim());


            // ============================
            // GO TO DASHBOARD
            // ============================

            setTimeout(() => {
                navigate(`/trips/${response.data.trip._id}`, {
                    state: {
                        emailSent: response.data.emailSent,
                        emailMessage: response.data.emailMessage,
                    },
                });
            }, 1800);


        } catch (error) {

            console.error(
                "Trip save error:",
                error
            );

            if (error.response?.status === 402) {
                navigate("/dashboard?purchase=required", {
                    state: { purchaseMessage: error.response.data?.message },
                });
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to save trip. Please try again."
            );

        } finally {

            setSaving(false);

        }
    };


    return (

        <div className="planner-page">


            <SiteNavbar />
            {/* ============================
                HEADER
            ============================ */}

            <section className="planner-header">

                <div className="planner-ai-badge">

                    <Sparkles size={17} />

                    AI TRIP PLANNER

                </div>


                <h1>
                    Plan your perfect trip
                </h1>


                <p>
                    {destinationPackage
                        ? "Choose your dates and travelers to add this destination package to your trips."
                        : "Tell us a little about your trip and our AI will create a personalized itinerary for you."}
                </p>

            </section>

            {destinationPackageLoading && (
                <p className="planner-package-status" role="status">Loading destination package...</p>
            )}
            {destinationPackage && (
                <section className="planner-package-summary" aria-label="Selected destination package">
                    <div>
                        <strong>{destinationPackage.name}</strong>
                        <span>{destinationPackage.durationDays} days · {destinationPackage.currency} {Number(destinationPackage.price).toLocaleString()} per traveler</span>
                    </div>
                    <p>Saving this trip uses your existing free-trip or trip-credit rules. No destination payment is collected here.</p>
                    {destinationPackage.bookingDetails?.notes && <p>{destinationPackage.bookingDetails.notes}</p>}
                    {destinationPackage.bookingDetails?.available === false && (
                        <p role="alert">This package is currently unavailable. Choose another destination.</p>
                    )}
                </section>
            )}


            {/* ============================
                FORM CONTAINER
            ============================ */}

            <main className="planner-container">


                <form
                    className="planner-form"
                    onSubmit={handleSubmit}
                    ref={formRef}
                >


                    {/* ============================
                        DESTINATION
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            <MapPin size={22} />

                            Where are you going?

                        </h2>


                        <div className="planner-trip-inputs">
                            <div>
                                <label htmlFor="trip-destination">Destination (optional for AI ideas)</label>
                                <input
                                    id="trip-destination"
                                    type="text"
                                    name="destination"
                                    value={destination}
                                    readOnly={Boolean(destinationPackage)}
                                    onChange={(event) => {
                                        setDestination(event.target.value);
                                        setSuggestions([]);
                                        setSelectedPlaces([]);
                                        invalidateOptimizedRoute();
                                    }}
                                    placeholder="e.g. Goa, Paris, Dubai..."
                                />
                            </div>
                            <div>
                                <label htmlFor="trip-days">Trip length (days)</label>
                                <input
                                    id="trip-days"
                                    type="number"
                                    name="days"
                                    min="1"
                                    max="30"
                                    value={tripDays}
                                    readOnly={Boolean(destinationPackage)}
                                    onChange={(event) => setTripDays(event.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="suggestions-toolbar">
                            <p>Enter a destination for local places, or only trip length for destination ideas. Suggestions use 3 days if duration is blank.</p>
                            <button
                                type="button"
                                className={`suggestions-trigger${findingSuggestions ? " is-loading" : ""}`}
                                onClick={() => findSuggestions()}
                                disabled={findingSuggestions || (!tripDays && !destination.trim())}
                                aria-busy={findingSuggestions}
                            >
                                <Sparkles size={17} />
                                {findingSuggestions ? "Finding places..." : "Find travel ideas"}
                            </button>
                        </div>

                        {suggestionError && (
                            <p className="suggestion-error" role="alert">{suggestionError}</p>
                        )}

                        {suggestions.length > 0 && (
                            <div className="suggestion-results" aria-live="polite">
                                <h3>
                                    {suggestionType === "places"
                                        ? `Places to explore in ${destination}`
                                        : `Destination ideas for ${tripDays} days`}
                                </h3>
                                <div className="suggestion-grid">
                                    {suggestions.map((suggestion) => {
                                        const isSelected = suggestionType === "destinations"
                                            ? destination.toLowerCase() === suggestion.name.toLowerCase()
                                            : selectedPlaces.includes(suggestion.name);
                                        return (
                                            <article
                                                className={`suggestion-card${isSelected ? " selected" : ""}`}
                                                key={suggestion.name}
                                            >
                                                <span>{suggestion.category}</span>
                                                <strong>{suggestion.name}</strong>
                                                <p>{suggestion.description}</p>
                                                <div className="suggestion-actions">
                                                    <button
                                                        type="button"
                                                        className="suggestion-use"
                                                        onClick={() => selectSuggestion(suggestion)}
                                                        aria-pressed={isSelected}
                                                    >
                                                        {suggestionType === "places"
                                                            ? isSelected ? "Added to plan" : "Add to plan"
                                                            : isSelected ? "Destination selected" : "Use destination"}
                                                    </button>
                                                    <a
                                                        className="suggestion-map-link"
                                                        href={suggestion.mapsUrl || `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${suggestion.name} ${destination}`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <MapPin size={15} />
                                                        View location
                                                    </a>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                                {suggestionType === "places" && (
                                    <section className="route-optimizer" aria-labelledby="route-optimizer-title">
                                        <div className="route-optimizer-heading">
                                            <div className="route-optimizer-icon"><Route size={19} /></div>
                                            <div>
                                                <h3 id="route-optimizer-title">Smart route optimizer</h3>
                                                <p>
                                                    {destination ? `Start in ${destination}` : "Set a trip destination to choose a starting point"}.
                                                    {" "}Select 2–8 places to compare routes and arrange the best stop order.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="route-optimizer-controls">
                                            <label>
                                                Optimize for
                                                <select
                                                    value={routeObjective}
                                                    onChange={(event) => {
                                                        setRouteObjective(event.target.value);
                                                        invalidateOptimizedRoute();
                                                    }}
                                                >
                                                    <option value="balanced">Balanced time, distance & cost</option>
                                                    <option value="time">Fastest travel time</option>
                                                    <option value="distance">Shortest distance</option>
                                                    <option value="cost">Lowest estimated cost</option>
                                                </select>
                                            </label>
                                            <button
                                                className={`route-optimize-button${optimizingRoute ? " is-loading" : ""}`}
                                                type="button"
                                                onClick={optimizeSelectedRoute}
                                                disabled={optimizingRoute || selectedPlaces.length < 2 || selectedPlaces.length > 8 || !destination.trim()}
                                                aria-busy={optimizingRoute}
                                            >
                                                <Route size={17} />
                                                {optimizingRoute ? "Finding your best route..." : "Optimize selected stops"}
                                            </button>
                                        </div>
                                        <p className="route-optimizer-hint">
                                            Free driving routes use OpenStreetMap and OSRM. Travel times are estimates without live traffic; transport cost is estimated, not a live fare.
                                        </p>
                                        {routeError && <p className="route-optimizer-error" role="alert">{routeError}</p>}

                                        {optimizedRoute && (
                                            <div className="optimized-route-results" aria-live="polite">
                                                <div className="optimized-route-summary">
                                                    <div>
                                                        <span>Total travel time</span>
                                                        <strong>{formatRouteDuration(optimizedRoute.summary.durationSeconds)}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Total distance</span>
                                                        <strong>{formatRouteDistance(optimizedRoute.summary.distanceMeters)}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Estimated transport</span>
                                                        <strong>{formatRouteCost(optimizedRoute.summary.estimatedCostInr)}</strong>
                                                    </div>
                                                </div>
                                                <p className="optimized-route-cost-note">{optimizedRoute.summary.estimatedCostNote}</p>
                                                <h4>Best stop order</h4>
                                                <ol className="optimized-route-stops">
                                                    <li><span className="optimized-route-stop-number">S</span><strong>{optimizedRoute.origin}</strong><small>Start</small></li>
                                                    {optimizedRoute.stops.map((stop) => (
                                                        <li key={`${stop.order}-${stop.name}`}>
                                                            <span className="optimized-route-stop-number">{stop.order}</span>
                                                            <strong>{stop.name}</strong>
                                                        </li>
                                                    ))}
                                                </ol>

                                                <OptimizedRouteMap
                                                    route={optimizedRoute.route}
                                                    origin={optimizedRoute.origin}
                                                    stops={optimizedRoute.stops}
                                                />

                                                <div className="optimized-route-directions">
                                                    <div className="optimized-route-directions-heading">
                                                        <h4>Turn-by-turn directions</h4>
                                                        <a href={getOpenStreetMapDirectionsUrl(optimizedRoute)} target="_blank" rel="noopener noreferrer">
                                                            Open in OpenStreetMap
                                                        </a>
                                                    </div>
                                                    {optimizedRoute.route.directions.map((leg, index) => (
                                                        <details className="optimized-route-leg" key={`${leg.from}-${leg.to}`}>
                                                            <summary>
                                                                <span>
                                                                    <strong>{index + 1}. {leg.to}</strong>
                                                                    <small>{leg.from} → {leg.to}</small>
                                                                </span>
                                                                <span className="optimized-route-leg-metrics">
                                                                    {formatRouteDistance(leg.distanceMeters)} · {formatRouteDuration(leg.durationSeconds)}
                                                                </span>
                                                            </summary>
                                                            {leg.steps.length > 0 ? (
                                                                <ol>
                                                                    {leg.steps.map((step, stepIndex) => (
                                                                        <li key={`${stepIndex}-${step.instruction}`}>
                                                                            <span>{step.instruction}</span>
                                                                            <small>{formatRouteDistance(step.distanceMeters)} · {formatRouteDuration(step.durationSeconds)}</small>
                                                                        </li>
                                                                    ))}
                                                                </ol>
                                                            ) : (
                                                                <p className="optimized-route-no-steps">Detailed turn-by-turn steps are unavailable for this leg.</p>
                                                            )}
                                                        </details>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}
                                <p className="suggestion-attribution">
                                    {suggestionSource === "wikivoyage" ? (
                                        <>Guide summaries from <a href="https://en.wikivoyage.org/" target="_blank" rel="noreferrer">Wikivoyage</a>.</>
                                    ) : suggestionSource === "gemini" ? (
                                        "Suggestions tailored to your trip preferences."
                                    ) : (
                                        "Suggested Goa highlights matched to your interests."
                                    )}
                                </p>
                            </div>
                        )}

                    </div>



                    {/* ============================
                        DATES
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            <CalendarDays size={22} />

                            When are you traveling?

                        </h2>


                        <div className="date-grid">


                            <div>
                                <label htmlFor="trip-start-date">Start date</label>
                                <input id="trip-start-date" type="date" name="startDate" required />
                            </div>


                        </div>

                    </div>



                    {/* ============================
                        TRAVELERS
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            <Users size={22} />

                            Who is traveling?

                        </h2>


                        <label htmlFor="trip-travelers">Number of travelers</label>


                        <input
                            type="number"
                            id="trip-travelers"
                            name="travelers"
                            min="1"
                            max="20"
                            value={travelerCount}
                            onChange={(event) => {
                                const nextCount = event.target.value;
                                setTravelerCount(nextCount);
                                if (destinationPackage) {
                                    setBudgetInput(String((Number(destinationPackage.price) || 0) * (Number(nextCount) || 0)));
                                }
                            }}
                            required
                        />

                    </div>



                    {/* ============================
                        BUDGET
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            <Wallet size={22} />

                            What's your budget?

                        </h2>


                        <label>
                            Total budget
                        </label>


                        <div className="budget-input">

                            <span>
                                {destinationPackage?.currency || "₹"}
                            </span>


                            <input
                                type="number"
                                name="budget"
                                placeholder="25000"
                                value={budgetInput}
                                readOnly={Boolean(destinationPackage)}
                                min={destinationPackage ? "0" : "1000"}
                                onChange={(event) => setBudgetInput(event.target.value)}
                                required
                            />

                        </div>


                        <p className="form-hint">

                            {destinationPackage
                                ? "Package total based on the selected price per traveler."
                                : "Enter your approximate total trip budget."}

                        </p>

                    </div>



                    {/* ============================
                        TRAVEL STYLE
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            ✨ What's your travel style?

                        </h2>


                        <label>
                            Travel style
                        </label>


                        <select
                            name="travelStyle"
                            value={travelStyle}
                            onChange={(event) => setTravelStyle(event.target.value)}
                        >

                            <option value="balanced">
                                Balanced
                            </option>

                            <option value="adventure">
                                Adventure
                            </option>

                            <option value="relaxing">
                                Relaxing
                            </option>

                            <option value="family">
                                Family
                            </option>

                            <option value="luxury">
                                Luxury
                            </option>

                            <option value="budget">
                                Budget
                            </option>

                            <option value="romantic">
                                Romantic
                            </option>

                        </select>

                    </div>



                    {/* ============================
                        INTERESTS
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            ❤️ What are you interested in?

                        </h2>


                        <p className="form-hint">

                            Select everything you would like to experience.

                        </p>


                        <div className="interest-grid">


                            {interestOptions.map((item) => (

                                <button
                                    type="button"
                                    key={item.name}
                                    className={
                                        interests.includes(
                                            item.name
                                        )
                                            ? "interest-btn selected"
                                            : "interest-btn"
                                    }
                                    onClick={() =>
                                        toggleInterest(
                                            item.name
                                        )
                                    }
                                >

                                    {item.icon}

                                    {item.name}

                                </button>

                            ))}


                        </div>

                        {interests.includes("Luxury events") && (
                            <p className="form-hint">
                                Gemini can suggest premium experiences such as private cruises, fine dining, spa visits, and cultural performances. Confirm current event dates, availability, and ticket prices before booking.
                            </p>
                        )}

                    </div>



                    {/* ============================
                        ERROR / SUCCESS
                    ============================ */}

                    {error && (

                        <div className="error-message">

                            {error}

                        </div>

                    )}


                    {success && (

                        <div className="success-message">

                            {success}

                        </div>

                    )}



                    {/* ============================
                        SUBMIT
                    ============================ */}

                    <button
                        type="submit"
                        className="generate-btn"
                        disabled={
                            saving ||
                            destinationPackageLoading ||
                            destinationPackage?.bookingDetails?.available === false
                        }
                    >

                        <Sparkles size={20} />


                        {saving
                            ? destinationPackage ? "Saving your package trip..." : "Generating your itinerary..."
                            : destinationPackage ? "Continue with this package" : "Generate My Trip"}


                        {!saving && (
                            <ArrowRight size={20} />
                        )}

                    </button>


                </form>



                {/* ============================
                    SIDE CARD
                ============================ */}

                <aside className="planner-side-card">

                    <div className="side-icon">

                        <Sparkles size={27} />

                    </div>


                    <h3>
                        Your AI travel assistant
                    </h3>


                    <p>

                        We'll analyze your preferences and create
                        a day-by-day itinerary tailored specifically
                        to you.

                    </p>


                    <div className="side-feature">

                        <span>✓</span>

                        Personalized itinerary

                    </div>


                    <div className="side-feature">

                        <span>✓</span>

                        Budget-friendly suggestions

                    </div>


                    <div className="side-feature">

                        <span>✓</span>

                        Places and activities

                    </div>


                    <div className="side-feature">

                        <span>✓</span>

                        Restaurant recommendations

                    </div>


                </aside>


            </main>

        </div>

    );
}


export default Planner;