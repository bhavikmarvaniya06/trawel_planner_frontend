import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";

import SiteNavbar from "../components/SiteNavbar";
import "./Legal.css";


function Terms() {

    return (

        <div className="legal-page">

            <SiteNavbar />

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

                    <Link to="/home" className="legal-back-link">
                        <ArrowLeft size={17} />
                        Back to TripAI
                    </Link>
                </section>
            </main>

        </div>

    );

}


export default Terms;
