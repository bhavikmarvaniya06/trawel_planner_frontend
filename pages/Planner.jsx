import { useState } from "react";
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

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import "./Planner.css";


function Planner() {

    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };


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


            // Get form values
            const tripData = {

                destination:
                    form.destination.value.trim(),

                startDate:
                    form.startDate.value,

                endDate:
                    form.endDate.value,

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

            if (
                new Date(tripData.endDate) <
                new Date(tripData.startDate)
            ) {

                setError(
                    "End date cannot be before start date."
                );

                setSaving(false);

                return;
            }


            if (tripData.interests.length === 0) {

                setError(
                    "Please select at least one interest."
                );

                setSaving(false);

                return;
            }


            // ============================
            // SEND TO BACKEND
            // ============================

            const response = await api.post(
                "/trips",
                tripData
            );


            console.log(
                "Trip saved:",
                response.data
            );


            // ============================
            // SUCCESS
            // ============================

            setSuccess(
                "Trip saved successfully! 🎉"
            );


            // ============================
            // GO TO DASHBOARD
            // ============================

            setTimeout(() => {

                navigate("/dashboard");

            }, 1000);


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


            {/* ============================
                NAVBAR
            ============================ */}

            <nav className="planner-navbar">

                <Link
                    to="/"
                    className="planner-logo"
                >
                    ✈ TripAI
                </Link>


                <div className="planner-nav-links">

                    <Link to="/">
                        Home
                    </Link>

                    <Link to="/explore">
                        Explore
                    </Link>

                    <Link to="/about">
                        About
                    </Link>

                    <Link
                        to="/planner"
                        className="active"
                    >
                        AI Planner
                    </Link>

                    <Link to="/contact">
                        Contact
                    </Link>

                </div>


                {user ? (
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="planner-login"
                    >
                        Logout
                    </button>
                ) : (
                    <div className="nav-actions">
                        <Link to="/login" className="planner-login">
                            Login
                        </Link>
                        <Link to="/register" className="signup-btn">
                            Sign Up
                        </Link>
                    </div>
                )}

            </nav>



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
                >


                    {/* ============================
                        DESTINATION
                    ============================ */}

                    <div className="form-section">

                        <h2>

                            <MapPin size={22} />

                            Where are you going?

                        </h2>


                        <label>
                            Destination
                        </label>


                        <input
                            type="text"
                            name="destination"
                            placeholder="e.g. Goa, Paris, Dubai..."
                            required
                        />

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

                                <label>
                                    Start date
                                </label>


                                <input
                                    type="date"
                                    name="startDate"
                                    required
                                />

                            </div>



                            <div>

                                <label>
                                    End date
                                </label>


                                <input
                                    type="date"
                                    name="endDate"
                                    required
                                />

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


                        <select name="travelStyle">

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


                        {saving
                            ? "Saving Trip..."
                            : "Generate My Trip"
                        }


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