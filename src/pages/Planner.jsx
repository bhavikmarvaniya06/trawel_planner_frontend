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
} from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SiteNavbar from "../components/SiteNavbar";

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
    const [tripDays, setTripDays] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionType, setSuggestionType] = useState("");
    const [suggestionSource, setSuggestionSource] = useState("");
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [findingSuggestions, setFindingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState("");
    const [budgetInput, setBudgetInput] = useState("");
    const [travelStyle, setTravelStyle] = useState("balanced");
    const formRef = useRef(null);
    const suggestionRequestRef = useRef(0);


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

    const selectSuggestion = async (suggestion) => {
        if (suggestionType === "destinations") {
            setDestination(suggestion.name);
            setSelectedPlaces([]);
            return;
        }

        setSelectedPlaces((current) => current.includes(suggestion.name)
            ? current.filter((place) => place !== suggestion.name)
            : [...current, suggestion.name]);
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
            const startDate = form.startDate.value;
            const days = Number(form.days.value);
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
                    Number(form.travelers.value),

                budget:
                    Number(form.budget.value),

                travelStyle:
                    form.travelStyle.value,

                interests:
                    interests,

            };


            // ============================
            // BASIC VALIDATION
            // ============================

            // ============================
            // SEND TO BACKEND
            // ============================

            const planResponse = await api.post("/ai/plan", tripData);
            const response = await api.post("/trips", {
                ...tripData,
                itinerary: planResponse.data.itinerary,
            });


            console.log(
                "Trip saved:",
                response.data
            );


            // ============================
            // SUCCESS
            // ============================

            const planMessage = planResponse.data.generatedBy === "wikivoyage"
                ? "Your guide-based itinerary is ready!"
                : "Your AI itinerary is ready!";
            setSuccess(`${planMessage} ${response.data.emailMessage || ""}`.trim());


            // ============================
            // GO TO DASHBOARD
            // ============================

            setTimeout(() => {
                navigate(`/trips/${response.data.trip._id}`);
            }, 1800);


        } catch (error) {

            console.error(
                "Trip save error:",
                error
            );


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
                    Tell us a little about your trip and our AI
                    will create a personalized itinerary for you.
                </p>

            </section>



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
                                    onChange={(event) => {
                                        setDestination(event.target.value);
                                        setSuggestions([]);
                                        setSelectedPlaces([]);
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
                                    onChange={(event) => setTripDays(event.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="suggestions-toolbar">
                            <p>Enter a destination for local places, or only trip length for destination ideas. Suggestions use 3 days if duration is blank.</p>
                            <button
                                type="button"
                                className="suggestions-trigger"
                                onClick={() => findSuggestions()}
                                disabled={findingSuggestions || (!tripDays && !destination.trim())}
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
                                                        href={suggestion.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${suggestion.name} ${destination}`)}`}
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
                                <label>Start date</label>
                                <input type="date" name="startDate" required />
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


                        <label>
                            Number of travelers
                        </label>


                        <input
                            type="number"
                            name="travelers"
                            min="1"
                            max="20"
                            defaultValue="2"
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
                                ₹
                            </span>


                            <input
                                type="number"
                                name="budget"
                                min="1000"
                                placeholder="25000"
                                value={budgetInput}
                                onChange={(event) => setBudgetInput(event.target.value)}
                                required
                            />

                        </div>


                        <p className="form-hint">

                            Enter your approximate total trip budget.

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
                        disabled={saving}
                    >

                        <Sparkles size={20} />


                        {saving ? "Generating your itinerary..." : "Generate My Trip"}


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