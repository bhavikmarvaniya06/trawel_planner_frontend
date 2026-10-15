import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Users,
    Wallet,
    MapPin,
    Sparkles,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./TripDetails.css";


function TripDetails() {

    const { id } = useParams();

    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [trip, setTrip] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


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


    const handleLogout = () => {
        logout();
        navigate("/login");
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


            {/* Navbar */}

            <nav className="trip-details-navbar">

                <div
                    className="trip-details-logo"
                    onClick={() => navigate("/")}
                >
                    ✈ TripAI
                </div>


                <div className="trip-details-nav-links">
                    <button onClick={() => navigate("/")}>Home</button>
                    <button onClick={() => navigate("/explore")}>Explore</button>
                    <button onClick={() => navigate("/about")}>About</button>
                    <button onClick={() => navigate("/planner")}>AI Planner</button>
                    <button onClick={() => navigate("/contact")}>Contact</button>
                </div>

                {user ? (
                    <button type="button" onClick={handleLogout} className="trip-details-login">
                        Logout
                    </button>
                ) : (
                    <div className="nav-actions">
                        <Link to="/login" className="trip-details-login">Login</Link>
                        <Link to="/register" className="signup-btn">Sign Up</Link>
                    </div>
                )}

            </nav>



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

                <section className="ai-itinerary-card">

                    <div className="ai-icon">

                        <Sparkles size={26} />

                    </div>


                    <div>

                        <h2>
                            Your AI Itinerary
                        </h2>

                        <p>
                            Generate a personalized
                            day-by-day itinerary for this trip.
                        </p>

                    </div>


                    <button>

                        <Sparkles size={17} />

                        Generate Itinerary

                    </button>

                </section>


            </main>

        </div>

    );
}


export default TripDetails;