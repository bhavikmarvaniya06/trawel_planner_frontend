import { MapPin, Search, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

function Home() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="home">

            {/* NAVBAR */}
            <nav className="navbar">

                <div className="logo">
                    <span>✈</span> TripAI
                </div>

                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/explore">Explore</Link>
                    <Link to="/about">About</Link>
                    <Link to="/planner">AI Planner</Link>
                    {user && <Link to="/contact">Contact</Link>}
                </div>

                <div className="nav-actions">
                    {user ? (
                        <button onClick={handleLogout} className="login-btn" type="button">
                            Logout
                        </button>
                    ) : (
                        <>
                            <Link to="/login" className="login-btn">
                                Login
                            </Link>

                            <Link to="/register" className="signup-btn">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

            </nav>


            {/* HERO */}
            <section className="hero">

                <div className="hero-overlay"></div>

                <div className="hero-content">

                    <div className="ai-badge">
                        <Sparkles size={16} />
                        AI-Powered Travel Planning
                    </div>

                    <h1>
                        Discover the world.
                        <br />
                        <span>We'll plan the journey.</span>
                    </h1>

                    <p>
                        Create personalized travel itineraries, discover
                        amazing places and plan your perfect trip with AI.
                    </p>


                    {/* SEARCH BOX */}
                    <div className="search-box">

                        <div className="search-field">

                            <MapPin size={21} />

                            <div>
                                <label>Where do you want to go?</label>
                                <input
                                    type="text"
                                    placeholder="Search a destination..."
                                />
                            </div>

                        </div>

                        <button className="search-btn">
                            <Search size={20} />
                            Search
                        </button>

                    </div>


                    {/* AI BUTTON */}
                    <button className="ai-planner-btn">

                        <Sparkles size={19} />

                        Plan my trip with AI

                        <ArrowRight size={19} />

                    </button>

                </div>

            </section>


            {/* POPULAR DESTINATIONS */}
            <section className="destinations">

                <div className="section-heading">

                    <div>
                        <span>EXPLORE</span>
                        <h2>Popular destinations</h2>
                    </div>

                    <Link to="/explore">
                        View all <ArrowRight size={17} />
                    </Link>

                </div>


                <div className="destination-grid">

                    <Destination
                        image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da"
                        name="India"
                        places="500+ places"
                    />

                    <Destination
                        image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34"
                        name="Paris"
                        places="350+ places"
                    />

                    <Destination
                        image="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad"
                        name="London"
                        places="420+ places"
                    />

                    <Destination
                        image="https://images.unsplash.com/photo-1536098561742-ca998e48cbcc"
                        name="Tokyo"
                        places="300+ places"
                    />

                </div>

            </section>


            {/* AI SECTION */}
            <section className="ai-section">

                <div className="ai-content">

                    <div className="ai-icon">
                        <Sparkles size={30} />
                    </div>

                    <span>YOUR PERSONAL TRAVEL ASSISTANT</span>

                    <h2>
                        Tell us where you want to go.
                        <br />
                        <strong>We'll handle the rest.</strong>
                    </h2>

                    <p>
                        Tell our AI about your destination, budget,
                        travel dates and interests. We'll create a
                        personalized day-by-day itinerary for you.
                    </p>

                    <button>
                        Start planning <ArrowRight size={18} />
                    </button>

                </div>

            </section>


            {/* FEATURES */}
            <section className="features">

                <div className="section-title">
                    <span>WHY TRIPAI</span>
                    <h2>Everything you need to travel better</h2>
                </div>


                <div className="feature-grid">

                    <Feature
                        icon="🤖"
                        title="AI Trip Planner"
                        text="Get a personalized itinerary based on your budget, interests and travel style."
                    />

                    <Feature
                        icon="📍"
                        title="Discover Places"
                        text="Find popular attractions, hidden gems, restaurants and activities."
                    />

                    <Feature
                        icon="💰"
                        title="Smart Budget"
                        text="Plan your expenses and keep your entire trip within your budget."
                    />

                </div>

            </section>


            {/* FOOTER */}
            <footer>

                <div className="footer-logo">
                    ✈ TripAI
                </div>

                <p>
                    Your intelligent travel companion.
                </p>

                <div className="footer-links">
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                </div>

                <p className="copyright">
                    © 2026 TripAI. All rights reserved.
                </p>

            </footer>

        </div>
    );
}


/* Destination Component */
function Destination({ image, name, places }) {

    return (
        <div className="destination-card">

            <img src={image} alt={name} />

            <div className="destination-overlay">

                <h3>{name}</h3>

                <p>{places}</p>

            </div>

        </div>
    );
}


/* Feature Component */
function Feature({ icon, title, text }) {

    return (
        <div className="feature-card">

            <div className="feature-icon">
                {icon}
            </div>

            <h3>{title}</h3>

            <p>{text}</p>

        </div>
    );
}


export default Home;