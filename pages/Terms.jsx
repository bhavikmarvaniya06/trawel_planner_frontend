import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Legal.css";


function Terms() {

    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (

        <div className="legal-page">

            <nav className="legal-navbar">
                <Link to="/" className="legal-logo">✈ TripAI</Link>
                <div className="legal-nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/explore">Explore</Link>
                    <Link to="/about">About</Link>
                    <Link to="/planner">AI Planner</Link>
                    <Link to="/contact">Contact</Link>
                </div>
                {user ? (
                    <button type="button" onClick={handleLogout} className="legal-login">Logout</button>
                ) : (
                    <div className="nav-actions">
                        <Link to="/login" className="legal-login">Login</Link>
                        <Link to="/register" className="signup-btn">Sign Up</Link>
                    </div>
                )}
            </nav>

            <main>
                <section className="legal-hero terms-hero">
                    <div className="legal-hero-content">
                        <div className="legal-badge">
                            <FileText size={16} />
                            THE TRIPAI AGREEMENT
                        </div>
                        <h1>Simple terms for better travel.</h1>
                        <p>
                            These guidelines help keep TripAI useful, respectful and dependable
                            for every traveler.
                        </p>
                    </div>
                    <Scale size={74} strokeWidth={1.2} />
                </section>

                <section className="legal-content">
                    <p className="legal-label">TERMS OF SERVICE</p>
                    <p className="legal-updated">Last updated: August 23, 2026</p>

                    <article>
                        <h2>Using TripAI</h2>
                        <p>
                            TripAI helps you discover destinations and create travel plans.
                            You agree to provide accurate information and use the service only
                            for lawful, personal travel planning.
                        </p>
                    </article>

                    <article>
                        <h2>Travel information</h2>
                        <p>
                            TripAI suggestions are provided for planning and inspiration.
                            Always confirm current prices, availability, entry requirements,
                            safety guidance and other details with official sources before
                            making travel decisions.
                        </p>
                    </article>

                    <article>
                        <h2>Content and availability</h2>
                        <p>
                            We work to keep TripAI accurate and available, but features and
                            information may change. You are responsible for reviewing your
                            itinerary before relying on it during a trip.
                        </p>
                    </article>

                    <Link to="/" className="legal-back-link">
                        <ArrowLeft size={17} />
                        Back to TripAI
                    </Link>
                </section>
            </main>

        </div>

    );

}


export default Terms;
