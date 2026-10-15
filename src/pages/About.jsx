import { Link } from "react-router-dom";
import {
    Sparkles,
    Map,
    Heart,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";

import SiteNavbar from "../components/SiteNavbar";
import "./About.css";


function About() {

    return (

        <div className="about-page">


            <SiteNavbar />


            {/* HERO */}

            <section className="about-hero">

                <div>

                    <div className="about-badge">

                        <Sparkles size={16} />

                        ABOUT TRIPAI

                    </div>


                    <h1>
                        Travel smarter.
                        <br />
                        Explore more.
                    </h1>


                    <p>
                        TripAI helps travelers discover destinations,
                        plan trips and create personalized itineraries
                        using artificial intelligence.
                    </p>

                </div>

            </section>



            {/* MISSION */}

            <section className="about-mission">

                <div>

                    <p className="about-label">
                        OUR MISSION
                    </p>

                    <h2>
                        Making travel planning simple
                        and personal.
                    </h2>

                </div>


                <p>

                    Planning a trip should be exciting, not stressful.
                    TripAI brings destinations, travel preferences,
                    budgets and AI-powered planning together in one
                    simple platform.

                </p>

            </section>



            {/* FEATURES */}

            <section className="about-features">

                <div className="about-feature">

                    <div className="about-feature-icon">
                        <Sparkles />
                    </div>

                    <h3>
                        AI Powered
                    </h3>

                    <p>
                        Generate personalized travel plans based
                        on your interests, budget and travel style.
                    </p>

                </div>


                <div className="about-feature">

                    <div className="about-feature-icon">
                        <Map />
                    </div>

                    <h3>
                        Discover Places
                    </h3>

                    <p>
                        Explore destinations and find experiences
                        that match your travel preferences.
                    </p>

                </div>


                <div className="about-feature">

                    <div className="about-feature-icon">
                        <Heart />
                    </div>

                    <h3>
                        Personalized
                    </h3>

                    <p>
                        Your trips are created around what you
                        actually want to experience.
                    </p>

                </div>


                <div className="about-feature">

                    <div className="about-feature-icon">
                        <ShieldCheck />
                    </div>

                    <h3>
                        Your Trips
                    </h3>

                    <p>
                        Save your travel plans and access them
                        from your personal dashboard.
                    </p>

                </div>

            </section>



            {/* CTA */}

            <section className="about-cta">

                <h2>
                    Ready to plan your next adventure?
                </h2>

                <p>
                    Let TripAI create your personalized travel plan.
                </p>


                <Link
                    to="/planner"
                    className="about-cta-btn"
                >

                    Start Planning

                    <ArrowRight size={18} />

                </Link>

            </section>


        </div>

    );

}


export default About;