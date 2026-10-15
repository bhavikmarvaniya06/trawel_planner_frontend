import { useState } from "react";
import { MapPin, Search, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import destinations, { destinationFallbackImage } from "../data/destinations";
import "./Home.css";

function Home() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [location, setLocation] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const matchingDestinations = location.trim()
        ? destinations.filter((destination) =>
            `${destination.name} ${destination.country} ${(destination.aliases || []).join(" ")}`
                .toLowerCase()
                .includes(location.trim().toLowerCase())
        )
        : [];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleSearch = (event) => {
        event.preventDefault();
        const query = location.trim();
        if (!query) return;
        navigate(`/planner?destination=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
    };

    return (
        <div className="home">

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

                    <form className="search-box" onSubmit={handleSearch} role="search">
                        <div className="search-field">
                            <MapPin size={21} />

                            <div>
                                <label htmlFor="home-destination-search">Where do you want to go?</label>
                                <input
                                    id="home-destination-search"
                                    type="text"
                                    placeholder="Search a destination..."
                                    aria-label="Search destinations"
                                    aria-autocomplete="list"
                                    aria-controls="home-destination-suggestions"
                                    value={location}
                                    onChange={(event) => {
                                        setLocation(event.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Escape") setShowSuggestions(false);
                                    }}
                                />
                            </div>
                        </div>

                        <button className="search-btn" type="submit">
                            <Search size={20} />
                            Search
                        </button>

                        {showSuggestions && location.trim() && (
                            <ul className="home-search-suggestions" id="home-destination-suggestions" role="listbox">
                                {matchingDestinations.length > 0 ? matchingDestinations.map((destination) => (
                                    <li key={destination.name} role="presentation">
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected="false"
                                            onClick={() => {
                                                setLocation(destination.name);
                                                setShowSuggestions(false);
                                                navigate(`/explore?location=${encodeURIComponent(destination.name)}`);
                                            }}
                                        >
                                            <MapPin size={17} />
                                            <span>{destination.name}</span>
                                            <small>{destination.country}</small>
                                        </button>
                                    </li>
                                )) : (
                                    <li className="home-no-suggestions">No matching destinations</li>
                                )}
                            </ul>
                        )}
                    </form>

                    <button className="ai-planner-btn" type="button">
                        <Sparkles size={19} />
                        Plan my trip with AI
                        <ArrowRight size={19} />
                    </button>
                </div>
            </section>

            <section className="destinations">
                <div className="section-heading">
                    <div>
                        <span>EXPLORE</span>
                        <h2>Popular destinations</h2>
                    </div>

                    <Link to="/explore">
                        See all <ArrowRight size={17} />
                    </Link>
                </div>

                <div className="destination-grid">
                    {destinations.slice(0, 9).map((destination) => (
                        <Destination key={destination.name} {...destination} />
                    ))}
                </div>
            </section>

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

                    <button type="button" onClick={() => navigate("/planner")}>
                        Start planning <ArrowRight size={18} />
                    </button>
                </div>
            </section>

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

function Destination({ image, name, country }) {
    return (
        <div className="destination-card">
            <img
                src={image}
                alt={name}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                    if (!event.currentTarget.src.endsWith(destinationFallbackImage)) {
                        event.currentTarget.src = destinationFallbackImage;
                    }
                }}
            />

            <div className="destination-overlay">
                <h3>{name}</h3>
                <p>{country}</p>
            </div>
        </div>
    );
}

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