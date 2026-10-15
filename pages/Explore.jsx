import { Link, useNavigate } from "react-router-dom";
import {
    MapPin,
    ArrowRight,
    Search,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Explore.css";


function Explore() {

    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const destinations = [
        {
            name: "Goa",
            country: "India",
            description:
                "Beautiful beaches, nightlife, food and relaxing coastal experiences.",
            image:
                "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
        },

        {
            name: "Dubai",
            country: "UAE",
            description:
                "Luxury, shopping, modern architecture and unforgettable experiences.",
            image:
                "https://images.unsplash.com/photo-1512453979798-5ea266f8880c",
        },

        {
            name: "Paris",
            country: "France",
            description:
                "Explore iconic landmarks, beautiful streets, art and amazing food.",
            image:
                "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
        },

        {
            name: "Bali",
            country: "Indonesia",
            description:
                "Tropical beaches, temples, nature and peaceful island experiences.",
            image:
                "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
        },

        {
            name: "London",
            country: "United Kingdom",
            description:
                "Discover historic landmarks, museums, culture and modern attractions.",
            image:
                "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad",
        },

        {
            name: "New York",
            country: "USA",
            description:
                "Experience the city's iconic skyline, food, shopping and entertainment.",
            image:
                "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee",
        },

        {
            name: "Musoorie",
            country:"India",
            description:
                "The Queen of Hills, where misty mountains meet timeless beauty.",
            image:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZIvRi-MbnMOSXi9bIIs9ClTXY778kRSil7pPLgWv1vA&s=10"
        },

        {
            name:"Black Forest",
            country:"Germany",
            description:"A gorgeous, densely wooded mountain range in southwest Germany",
            image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEMltiCmkmaojiYdqSDllCK1ZSJJLiHW9pwLUvZ_7Luw&s=10"
        }
    ];


    return (

        <div className="explore-page">


            {/* NAVBAR */}

            <nav className="explore-navbar">

                <Link
                    to="/"
                    className="explore-logo"
                >
                    ✈ TripAI
                </Link>


                <div className="explore-nav-links">

                    <Link to="/">
                        Home
                    </Link>

                    <Link
                        to="/explore"
                        className="active"
                    >
                        Explore
                    </Link>

                    <Link to="/about">
                        About
                    </Link>

                    <Link to="/planner">
                        AI Planner
                    </Link>

                    <Link to="/contact">
                        Contact
                    </Link>

                </div>


                {user ? (
                    <button type="button" onClick={handleLogout} className="explore-login">
                        Logout
                    </button>
                ) : (
                    <div className="nav-actions">
                        <Link to="/login" className="explore-login">
                            Login
                        </Link>
                        <Link to="/register" className="signup-btn">
                            Sign Up
                        </Link>
                    </div>
                )}

            </nav>



            {/* HERO */}

            <section className="explore-hero">

                <div className="explore-hero-content">

                    <div className="explore-badge">

                        <Search size={16} />

                        EXPLORE THE WORLD

                    </div>


                    <h1>
                        Discover your next adventure
                    </h1>


                    <p>
                        Explore amazing destinations and let
                        TripAI help you create the perfect trip.
                    </p>


                    <Link
                        to="/planner"
                        className="explore-cta"
                    >
                        Plan My Trip
                        <ArrowRight size={18} />
                    </Link>

                </div>

            </section>



            {/* DESTINATIONS */}

            <section className="destinations-section">

                <div className="explore-section-header">

                    <div>

                        <p>
                            POPULAR DESTINATIONS
                        </p>

                        <h2>
                            Where will you go next?
                        </h2>

                    </div>

                </div>


                <div className="destination-grid">

                    {destinations.map((destination) => (

                        <div
                            className="destination-card"
                            key={destination.name}
                        >

                            <img
                                src={destination.image}
                                alt={destination.name}
                            />


                            <div className="destination-content">

                                <div className="destination-location">

                                    <MapPin size={16} />

                                    {destination.name},{" "}
                                    {destination.country}

                                </div>


                                <h3>
                                    {destination.name}
                                </h3>


                                <p>
                                    {destination.description}
                                </p>


                                <Link
                                    to="/planner"
                                    className="destination-link"
                                >
                                    Plan a trip
                                    <ArrowRight size={16} />
                                </Link>

                            </div>

                        </div>

                    ))}

                </div>

            </section>



            {/* CTA */}

            <section className="explore-bottom">

                <h2>
                    Don't know where to go?
                </h2>

                <p>
                    Let our AI create a destination and itinerary
                    based on your preferences.
                </p>


                <Link
                    to="/planner"
                    className="explore-cta"
                >
                    Try AI Planner
                    <ArrowRight size={18} />
                </Link>

            </section>


        </div>

    );

}


export default Explore;