import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

import SiteNavbar from "../components/SiteNavbar";
import "./Legal.css";


function Privacy() {

    return (

        <div className="legal-page">

            <SiteNavbar />

            <main>
                <section className="legal-hero">
                    <div className="legal-hero-content">
                        <div className="legal-badge">
                            <LockKeyhole size={16} />
                            YOUR PRIVACY MATTERS
                        </div>
                        <h1>Privacy, made clear.</h1>
                        <p>
                            We want you to feel confident while using TripAI. Here is how we
                            handle the information you share with us.
                        </p>
                    </div>
                    <ShieldCheck size={74} strokeWidth={1.2} />
                </section>

                <section className="legal-content">
                    <p className="legal-label">PRIVACY POLICY</p>
                    <p className="legal-updated">Last updated: August 23, 2026</p>

                    <article>
                        <h2>Information we collect</h2>
                        <p>
                            When you use TripAI, you may provide details such as your name,
                            email address, travel preferences, destinations and trip queries.
                            We also collect basic technical information needed to keep the
                            service reliable.
                        </p>
                    </article>

                    <article>
                        <h2>How we use your information</h2>
                        <p>
                            We use this information to provide travel planning features,
                            personalize your experience, respond to support requests and
                            improve the product. We do not sell your personal information.
                        </p>
                    </article>

                    <article>
                        <h2>Your choices</h2>
                        <p>
                            You can review or update information associated with your account
                            and contact us with privacy questions at any time.
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


export default Privacy;
