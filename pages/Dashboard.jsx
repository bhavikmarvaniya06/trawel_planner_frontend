import { useEffect, useState } from "react";
import {
    MapPin,
    CalendarDays,
    Users,
    Wallet,
    Plus,
    LogOut,
    Compass,
    Star,
    Heart,
    Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import "./Dashboard.css";


function Dashboard() {

    const { user, logout } = useAuth();

    const navigate = useNavigate();


    const [trips, setTrips] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================
    // GET USER TRIPS
    // ============================

    useEffect(() => {

        const fetchTrips = async () => {

            try {

                const response = await api.get("/trips");

                setTrips(response.data.trips || []);

            } catch (error) {

                console.error(
                    "Failed to fetch trips:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load trips"
                );

            } finally {

                setLoading(false);

            }
        };


        fetchTrips();

    }, []);


    // ============================
    // LOGOUT
    // ============================

    const handleLogout = () => {

        logout();

        navigate("/login");

    };


    // ============================
    // FORMAT DATE
    // ============================

    const formatDate = (date) => {

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );

    };


    return (

        <div className="dashboard-page">


            {/* ============================
                NAVBAR
            ============================ */}

            <nav className="dashboard-navbar">

                <div
                    className="dashboard-logo"
                    onClick={() => navigate("/")}
                >
                    ✈ TripAI
                </div>


                <div className="dashboard-nav-links">

                    <button
                        onClick={() => navigate("/")}
                    >
                        Home
                    </button>

                    <button
                        onClick={() => navigate("/explore")}
                    >
                        Explore
                    </button>

                    <button
                        onClick={() => navigate("/about")}
                    >
                        About
                    </button>

                    <button
                        onClick={() => navigate("/planner")}
                    >
                        AI Planner
                    </button>

                    <button
                        onClick={() => navigate("/contact")}
                    >
                        Contact
                    </button>

                </div>


                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    <LogOut size={17} />
                    Logout
                </button>

            </nav>



            {/* ============================
                HEADER
            ============================ */}

            <section className="dashboard-header">

                <div>

                    <p className="dashboard-welcome">
                        Your Travel Dashboard
                    </p>

                    <h1>
                        Welcome, {user?.name} 👋
                    </h1>

                    <p className="dashboard-email">
                        {user?.email}
                    </p>

                </div>


                <button
                    className="create-trip-btn"
                    onClick={() => navigate("/planner")}
                >

                    <Plus size={19} />

                    Plan New Trip

                </button>

            </section>



            {/* ============================
                STATS
            ============================ */}

            <section className="dashboard-stats">


                <div className="stat-card">

                    <div className="stat-icon">
                        <Compass size={22} />
                    </div>

                    <div>

                        <span>
                            Total Trips
                        </span>

                        <strong>
                            {trips.length}
                        </strong>

                    </div>

                </div>



                <div className="stat-card">

                    <div className="stat-icon">
                        <Heart size={22} />
                    </div>

                    <div>

                        <span>
                            Saved Places
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>



                <div className="stat-card">

                    <div className="stat-icon">
                        <Star size={22} />
                    </div>

                    <div>

                        <span>
                            Reviews
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>


            </section>



            {/* ============================
                MY TRIPS
            ============================ */}

            <section className="trips-section">


                <div className="section-heading">

                    <div>

                        <h2>
                            My Trips
                        </h2>

                        <p>
                            Your saved travel plans
                        </p>

                    </div>


                    <button
                        onClick={() => navigate("/planner")}
                    >
                        <Plus size={17} />
                        New Trip
                    </button>

                </div>



                {loading && (

                    <div className="dashboard-message">

                        Loading your trips...

                    </div>

                )}



                {error && !loading && (

                    <div className="dashboard-error">

                        {error}

                    </div>

                )}



                {!loading &&
                    !error &&
                    trips.length === 0 && (

                        <div className="empty-trips">

                            <div className="empty-icon">

                                <Sparkles size={30} />

                            </div>


                            <h3>
                                No trips yet
                            </h3>


                            <p>
                                Start planning your next adventure
                                with our AI travel planner.
                            </p>


                            <button
                                onClick={() =>
                                    navigate("/planner")
                                }
                            >

                                <Sparkles size={17} />

                                Plan Your First Trip

                            </button>

                        </div>

                    )}



                {!loading &&
                    !error &&
                    trips.length > 0 && (

                        <div className="trips-grid">

                            {trips.map((trip) => (

                                            <div
                className="trip-card"
                key={trip._id}
                onClick={() =>
                    navigate(`/trips/${trip._id}`)
                }
            >


                                    {/* Trip Image */}

                                    <div className="trip-image">

                                        <div className="trip-image-overlay">

                                            <MapPin size={18} />

                                            {trip.destination}

                                        </div>

                                    </div>



                                    {/* Trip Content */}

                                    <div className="trip-content">

                                        <h3>
                                            {trip.destination}
                                        </h3>


                                        <div className="trip-detail">

                                            <CalendarDays
                                                size={17}
                                            />

                                            <span>

                                                {formatDate(
                                                    trip.startDate
                                                )}

                                                {" - "}

                                                {formatDate(
                                                    trip.endDate
                                                )}

                                            </span>

                                        </div>


                                        <div className="trip-detail">

                                            <Users size={17} />

                                            <span>

                                                {trip.travelers}
                                                {" "}
                                                traveler
                                                {trip.travelers > 1
                                                    ? "s"
                                                    : ""
                                                }

                                            </span>

                                        </div>


                                        <div className="trip-detail">

                                            <Wallet size={17} />

                                            <span>

                                                ₹
                                                {Number(
                                                    trip.budget
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}

                                            </span>

                                        </div>


                                        <div className="trip-tags">

                                            <span>
                                                {trip.travelStyle}
                                            </span>


                                            {trip.interests
                                                ?.slice(0, 3)
                                                .map((interest) => (

                                                    <span
                                                        key={interest}
                                                    >
                                                        {interest}
                                                    </span>

                                                ))
                                            }

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

            </section>



            {/* ============================
                QUICK ACTIONS
            ============================ */}

            <section className="quick-section">

                <h2>
                    Quick Actions
                </h2>


                <div className="quick-grid">


                    <button
                        onClick={() =>
                            navigate("/planner")
                        }
                    >

                        <Sparkles size={23} />

                        <div>

                            <strong>
                                AI Trip Planner
                            </strong>

                            <span>
                                Create a personalized itinerary
                            </span>

                        </div>

                    </button>



                    <button
                        onClick={() =>
                            navigate("/explore")
                        }
                    >

                        <Compass size={23} />

                        <div>

                            <strong>
                                Explore Destinations
                            </strong>

                            <span>
                                Discover amazing places
                            </span>

                        </div>

                    </button>


                </div>

            </section>


        </div>

    );

}


export default Dashboard;