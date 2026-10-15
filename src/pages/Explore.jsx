import { Link } from "react-router-dom";
import {
    MapPin,
    ArrowRight,
    Search,
} from "lucide-react";

import SiteNavbar from "../components/SiteNavbar";
import destinations, { destinationFallbackImage } from "../data/destinations";
import "./Explore.css";


function Explore() {
    const filteredDestinations = destinations;


    return (

        <div className="explore-page">


            <SiteNavbar />


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

                    {filteredDestinations.map((destination) => (

                        <div
                            className="destination-card"
                            key={destination.name}
                        >

                            <div className="destination-image">
                                <img
                                    src={destination.image}
                                    alt={destination.name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(event) => {
                                        if (!event.currentTarget.src.endsWith(destinationFallbackImage)) {
                                            event.currentTarget.src = destinationFallbackImage;
                                        }
                                    }}
                                />
                                <h3 className="destination-image-title">{destination.name}</h3>
                                {destination.imageCredit && (
                                    <a
                                        className="destination-image-credit"
                                        href={destination.imageCredit.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {destination.imageCredit.label}
                                    </a>
                                )}
                            </div>


                            <div className="destination-content">

                                <div className="destination-location">

                                    <MapPin size={16} />

                                    {destination.name},{" "}
                                    {destination.country}

                                </div>


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