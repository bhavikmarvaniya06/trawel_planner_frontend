import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, MessageCircle, Send, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import "./FeedbackWidget.css";

const ratingOptions = [
    { value: 1, emoji: "😣", label: "Hate" },
    { value: 2, emoji: "🙁", label: "Not great" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 5, emoji: "🤩", label: "Love" },
];

function FeedbackWidget() {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!user) return;
        setForm((current) => ({
            ...current,
            name: current.name || user.name || "",
            email: current.email || user.email || "",
        }));
    }, [user]);

    if (pathname.startsWith("/admin")) return null;

    const updateField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setError("");
    };

    const submitFeedback = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await api.post("/feedback", { ...form, rating, page: pathname });
            setSubmitted(true);
            setForm((current) => ({ ...current, message: "" }));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Feedback could not be sent. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const openPanel = () => {
        setIsOpen(true);
        setStep(1);
        setSubmitted(false);
        setError("");
    };

    return (
        <aside className="feedback-widget" aria-label="Share feedback">
            {isOpen && (
                <section className="feedback-panel" role="dialog" aria-modal="false" aria-labelledby="feedback-title">
                    <div className="feedback-panel-top">
                        <div>
                            <span className="feedback-eyebrow">TRIPAI · YOUR VOICE</span>
                            <h2 id="feedback-title">{step === 1 ? "How would you rate your experience?" : "Tell us about your experience"}</h2>
                        </div>
                        <button type="button" className="feedback-close" aria-label="Close feedback" onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    {submitted ? (
                        <div className="feedback-success" role="status">
                            <span className="feedback-success-icon"><Check size={22} /></span>
                            <h3>Thanks for helping us get better.</h3>
                            <p>Your feedback has been received.</p>
                            <button type="button" onClick={() => setIsOpen(false)}>Done</button>
                        </div>
                    ) : (
                        <>
                            <div className="feedback-progress" aria-label={`Step ${step} of 2`}>
                                <span className={step === 1 ? "is-current" : "is-complete"}>01 <span>Rating</span></span>
                                <i />
                                <span className={step === 2 ? "is-current" : ""}>02 <span>Your feedback</span></span>
                            </div>

                            {step === 1 ? (
                                <div className="feedback-rating-step">
                                    <div className="feedback-emojis" role="radiogroup" aria-label="Rate your experience">
                                        {ratingOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`feedback-emoji${rating === option.value ? " is-selected" : ""}`}
                                                role="radio"
                                                aria-checked={rating === option.value}
                                                aria-label={`${option.value} out of 5: ${option.label}`}
                                                onClick={() => { setRating(option.value); setError(""); }}
                                            >
                                                <span aria-hidden="true">{option.emoji}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="feedback-rating-labels"><span>Hate</span><span>Love</span></div>
                                    <div className="feedback-rating-footer">
                                        <p role="status">{rating ? ratingOptions[rating - 1].label : "Choose the face that feels right"}</p>
                                        <button className="feedback-submit" type="button" disabled={!rating} onClick={() => setStep(2)}>
                                            <span>Next</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form className="feedback-form" onSubmit={submitFeedback}>
                                    <label className="feedback-field">
                                        <span>Your name</span>
                                        <input name="name" autoComplete="name" maxLength="80" required value={form.name} onChange={updateField} placeholder="Name" />
                                    </label>
                                    <label className="feedback-field">
                                        <span>Email address</span>
                                        <input name="email" type="email" autoComplete="email" maxLength="160" required value={form.email} onChange={updateField} placeholder="you@example.com" />
                                    </label>
                                    <label className="feedback-field">
                                        <span>Tell us about your experience</span>
                                        <textarea name="message" rows="3" maxLength="1200" required value={form.message} onChange={updateField} placeholder="What did you enjoy? What could we do better?" />
                                    </label>
                                    <div className="feedback-form-footer">
                                        {error && <p className="feedback-error" role="alert">{error}</p>}
                                        <span className="feedback-count">{form.message.length}/1200</span>
                                    </div>
                                    <div className="feedback-step-actions">
                                        <button type="button" className="feedback-back" onClick={() => { setStep(1); setError(""); }}>
                                            <ArrowLeft size={15} /> Back
                                        </button>
                                        <button className="feedback-submit" type="submit" disabled={submitting}>
                                            <span>{submitting ? "Sending..." : "Send feedback"}</span>
                                            <Send size={16} />
                                        </button>
                                    </div>
                                    <p className="feedback-privacy">Your note is shared privately with the TripAI team.</p>
                                </form>
                            )}
                        </>
                    )}
                </section>
            )}

            <button
                type="button"
                className={`feedback-launcher${isOpen ? " is-open" : ""}`}
                aria-expanded={isOpen}
                onClick={() => isOpen ? setIsOpen(false) : openPanel()}
            >
                {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
                <span>{isOpen ? "Close" : "Feedback"}</span>
            </button>
        </aside>
    );
}

export default FeedbackWidget;