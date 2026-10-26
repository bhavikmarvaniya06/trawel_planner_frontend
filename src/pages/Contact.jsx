import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Mail,
    MessageCircle,
    Send,
    Sparkles,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import SiteNavbar from "../components/SiteNavbar";
import "./Contact.css";


function Contact() {

    const navigate = useNavigate();
    const { user } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        query: "",
    });

    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setSubmitted(false);
        setError("");
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setSubmitted(false);
        setError("");
        try {
            await api.post("/contact", formData);
            setSubmitted(true);
            setFormData({
                name: "",
                email: "",
                query: "",
            });
        } catch (requestError) {
            setSubmitted(false);
            setError(requestError.response?.data?.message || "Unable to send your message right now.");
        } finally {
            setSubmitting(false);
        }
    }


    return (

        <div className="contact-page">

            <SiteNavbar />

            <main>

                <section className="contact-hero">

                    <div className="contact-hero-content">

                        <div className="contact-badge">
                            <Sparkles size={16} />
                            WE ARE HERE TO HELP
                        </div>

                        <h1>
                            Let&apos;s make your next journey unforgettable.
                        </h1>

                        <p>
                            Have a question about TripAI or need help planning your adventure?
                            Send us a note and our team will get back to you.
                        </p>

                    </div>

                    <div className="contact-hero-mark">
                        <MessageCircle size={34} />
                        <span>Talk to our team</span>
                    </div>

                </section>

                <section className="contact-content">

                    <div className="contact-details">

                        <p className="contact-label">CONTACT TRIPAI</p>
                        <h2>We&apos;d love to hear from you.</h2>
                        <p className="contact-description">
                            Whether you are curious about a destination, need a hand with your
                            itinerary, or have feedback to share, this is the place to start.
                        </p>

                        <div className="contact-detail-item">
                            <div className="contact-detail-icon">
                                <Mail size={20} />
                            </div>
                            <div>
                                <strong>Email us</strong>
                                <span>hello@tripai.com</span>
                            </div>
                        </div>

                        <div className="contact-detail-item">
                            <div className="contact-detail-icon">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <strong>Response time</strong>
                                <span>Usually within one business day</span>
                            </div>
                        </div>

                    </div>

                    <form className="contact-form" onSubmit={handleSubmit}>

                        <div className="contact-form-heading">
                            <div>
                                <p className="contact-label">SEND A MESSAGE</p>
                                <h2>How can we help?</h2>
                            </div>
                            <Send size={22} />
                        </div>

                        {error && <p className="contact-error" role="alert">{error}</p>}

                        <label htmlFor="name">Your name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                        />

                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />

                        <label htmlFor="query">Your query</label>
                        <textarea
                            id="query"
                            name="query"
                            rows="6"
                            value={formData.query}
                            onChange={handleChange}
                            placeholder="Tell us how we can help..."
                            required
                        />

                        <button type="submit" disabled={submitting}>
                            {submitting ? "Sending..." : submitted ? "Message sent" : "Send query"}
                            <ArrowRight size={18} />
                        </button>

                        {submitted && (
                            <p className="contact-success" role="status">
                                Thanks. Your message has been successfully submitted.
                            </p>
                        )}

                    </form>

                </section>

            </main>

        </div>

    );

}


export default Contact;
