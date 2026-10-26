import { useCallback, useEffect, useState } from "react";
import {
    MapPin,
    CalendarDays,
    Users,
    Wallet,
    Plus,
    Compass,
    Star,
    Heart,
    Sparkles,
    Crown,
    X,
    ArrowRight,
    ShieldCheck,
    Minus,
    CloudRain,
    ArrowUpRight,
} from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SiteNavbar from "../components/SiteNavbar";
import { destinationFallbackImage, getDestinationImage } from "../data/destinations";

import "./Dashboard.css";


function Dashboard() {

    const { user } = useAuth();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const purchaseRequired = searchParams.get("purchase") === "required";
    const plansRequested = searchParams.get("plans") === "show";
    const posterAccountId = user?._id || user?.id || user?.email || "account";
    const posterSeenKey = `tripai-plan-poster-seen:${posterAccountId}`;
    const posterMinimizedKey = `tripai-plan-poster-minimized:${posterAccountId}`;
    const isAdmin = user?.role === "admin";
    const startNewTrip = () => navigate("/planner");

    useEffect(() => {
        if (isAdmin) {
            navigate("/admin", { replace: true });
        }
    }, [isAdmin, navigate]);


    const [trips, setTrips] = useState([]);
    const [paymentAccount, setPaymentAccount] = useState({ freeTripAvailable: true, tripCredits: 0, packages: [], payments: [] });
    const [paymentError, setPaymentError] = useState("");
    const [paymentMessage, setPaymentMessage] = useState("");
    const [buyingPackage, setBuyingPackage] = useState("");
    const [paymentAccountLoading, setPaymentAccountLoading] = useState(true);
    const [showPlanPoster, setShowPlanPoster] = useState(false);
    const [isPlanPosterMinimized, setIsPlanPosterMinimized] = useState(
        () => localStorage.getItem(posterMinimizedKey) === "true"
    );

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [weatherNotifications, setWeatherNotifications] = useState([]);
    const [weatherNotificationsError, setWeatherNotificationsError] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [savedPlaces, setSavedPlaces] = useState([]);
    const [recommendationBudget, setRecommendationBudget] = useState("");
    const [recommendationDays, setRecommendationDays] = useState("3");
    const [recommendationsLoading, setRecommendationsLoading] = useState(true);
    const [recommendationsError, setRecommendationsError] = useState("");
    const [tripInvitations, setTripInvitations] = useState([]);
    const [invitationsError, setInvitationsError] = useState("");
    const [acceptingInvitation, setAcceptingInvitation] = useState("");

    useEffect(() => {
        let mounted = true;

        const fetchWeatherNotifications = async () => {
            try {
                const response = await api.get("/notifications");
                if (mounted) {
                    setWeatherNotifications(response.data.notifications || []);
                    setWeatherNotificationsError("");
                }
            } catch (requestError) {
                console.error("Failed to fetch weather notifications:", requestError);
                if (mounted) {
                    setWeatherNotificationsError(
                        requestError.response?.data?.message || "Weather alerts are temporarily unavailable."
                    );
                }
            }
        };

        fetchWeatherNotifications();
        const interval = window.setInterval(fetchWeatherNotifications, 5 * 60 * 1000);

        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, []);

    const markWeatherNotificationRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setWeatherNotifications((current) => current.map((notification) => (
                notification._id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )));
        } catch (requestError) {
            console.error("Failed to acknowledge weather notification:", requestError);
            setWeatherNotificationsError(
                requestError.response?.data?.message || "Unable to update this weather alert."
            );
        }
    };

    const fetchRecommendations = useCallback(async (budget = "", days = "3") => {
        setRecommendationsLoading(true);
        setRecommendationsError("");
        try {
            const params = { days: Number(days) || 3 };
            if (budget !== "") params.budget = Number(budget);
            const response = await api.get("/recommendations", { params });
            setRecommendations(response.data.recommendations || []);
            setSavedPlaces(response.data.profile?.savedPlaces || []);
        } catch (requestError) {
            console.error("Failed to load destination recommendations:", requestError);
            setRecommendationsError(requestError.response?.data?.message || "Recommendations are temporarily unavailable.");
        } finally {
            setRecommendationsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecommendations();
        api.get("/trips/invitations")
            .then((response) => setTripInvitations(response.data.invitations || []))
            .catch((requestError) => {
                console.error("Failed to load group trip invitations:", requestError);
                setInvitationsError(requestError.response?.data?.message || "Unable to load trip invitations.");
            });
    }, [fetchRecommendations]);

    const toggleSavedPlace = async (destination) => {
        try {
            const response = await api.post("/recommendations/saved-places", { destination });
            setSavedPlaces(response.data.savedPlaces || []);
            await fetchRecommendations(recommendationBudget, recommendationDays);
        } catch (requestError) {
            console.error("Failed to update saved destination:", requestError);
            setRecommendationsError(requestError.response?.data?.message || "Unable to update saved destinations.");
        }
    };

    const acceptTripInvitation = async (tripId) => {
        setAcceptingInvitation(tripId);
        setInvitationsError("");
        try {
            await api.patch(`/trips/${tripId}/invitations/accept`);
            setTripInvitations((current) => current.filter((invitation) => invitation._id !== tripId));
            navigate(`/trips/${tripId}`);
        } catch (requestError) {
            console.error("Failed to accept trip invitation:", requestError);
            setInvitationsError(requestError.response?.data?.message || "Unable to accept this trip invitation.");
        } finally {
            setAcceptingInvitation("");
        }
    };


    // ============================
    // GET USER TRIPS
    // ============================

    useEffect(() => {

        const fetchTrips = async () => {

            try {

                const response = await api.get("/trips");

                setTrips(response.data.trips || []);

            } catch (error) {

                console.error(
                    "Failed to fetch trips:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load trips"
                );

            } finally {

                setLoading(false);

            }
        };


        fetchTrips();

    }, []);

    useEffect(() => {
        const fetchPaymentAccount = async () => {
            try {
                const response = await api.get("/payments/account");
                setPaymentAccount({
                    freeTripAvailable: response.data.freeTripAvailable === true,
                    tripCredits: Number(response.data.tripCredits) || 0,
                    packages: response.data.packages || [],
                    payments: response.data.payments || [],
                });
            } catch (requestError) {
                console.error("Failed to fetch trip credits:", requestError);
                setPaymentError(requestError.response?.data?.message || "Unable to load trip credits and payment history.");
            } finally {
                setPaymentAccountLoading(false);
            }
        };

        fetchPaymentAccount();
    }, []);

    useEffect(() => {
        if (loading || paymentAccountLoading) return undefined;

        if (plansRequested && !paymentMessage) {
            localStorage.setItem(posterSeenKey, "true");
            const isMinimized = localStorage.getItem(posterMinimizedKey) === "true";
            setIsPlanPosterMinimized(isMinimized);
            setShowPlanPoster(true);
            return undefined;
        }

        const hasTripAccess = paymentAccount.freeTripAvailable || paymentAccount.tripCredits > 0;
        if (hasTripAccess) {
            setShowPlanPoster(false);
            setIsPlanPosterMinimized(false);
            localStorage.removeItem(posterSeenKey);
            localStorage.removeItem(posterMinimizedKey);
            return undefined;
        }

        if (purchaseRequired) {
            localStorage.setItem(posterSeenKey, "true");
            const isMinimized = localStorage.getItem(posterMinimizedKey) === "true";
            setIsPlanPosterMinimized(isMinimized);
            setShowPlanPoster(true);
            return undefined;
        }

        if (localStorage.getItem(posterSeenKey) === "true") {
            if (localStorage.getItem(posterMinimizedKey) === "true") {
                setIsPlanPosterMinimized(true);
                setShowPlanPoster(true);
            }
            return undefined;
        }

        const hasPurchasedCreditsBefore = paymentAccount.payments.some(
            (payment) => payment.status === "paid"
        );
        if (hasPurchasedCreditsBefore) {
            localStorage.setItem(posterSeenKey, "true");
            localStorage.removeItem(posterMinimizedKey);
            setIsPlanPosterMinimized(false);
            setShowPlanPoster(true);
            return undefined;
        }

        const firstTrip = [...trips]
            .filter((trip) => Number.isFinite(new Date(trip.createdAt).getTime()))
            .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))[0];

        if (!firstTrip) return undefined;

        const showAt = new Date(firstTrip.createdAt).getTime() + (30 * 1000);
        const delay = Math.max(0, showAt - Date.now());
        const timer = window.setTimeout(() => {
            localStorage.setItem(posterSeenKey, "true");
            localStorage.removeItem(posterMinimizedKey);
            setIsPlanPosterMinimized(false);
            setShowPlanPoster(true);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [
        loading,
        paymentAccountLoading,
        paymentAccount.freeTripAvailable,
        paymentAccount.tripCredits,
        paymentAccount.payments,
        purchaseRequired,
        plansRequested,
        paymentMessage,
        posterSeenKey,
        posterMinimizedKey,
        trips,
    ]);

    useEffect(() => {
        if (!showPlanPoster || isPlanPosterMinimized) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                localStorage.setItem(posterMinimizedKey, "true");
                setIsPlanPosterMinimized(true);
            }
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showPlanPoster, isPlanPosterMinimized, posterMinimizedKey]);

    const refreshPaymentAccount = async () => {
        const response = await api.get("/payments/account");
        setPaymentAccount({
            freeTripAvailable: response.data.freeTripAvailable === true,
            tripCredits: Number(response.data.tripCredits) || 0,
            packages: response.data.packages || [],
            payments: response.data.payments || [],
        });
    };

    const startPackagePurchase = async (creditPackage) => {
        setBuyingPackage(creditPackage.key);
        setPaymentError("");
        setPaymentMessage("");

        try {
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.async = true;
                    script.onload = resolve;
                    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded."));
                    document.body.appendChild(script);
                });
            }

            const orderResponse = await api.post("/payments/orders", { packageKey: creditPackage.key });
            const order = orderResponse.data;
            const checkout = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: "TripAI",
                description: `${order.credits} AI trip credit${order.credits === 1 ? "" : "s"}`,
                order_id: order.orderId,
                prefill: { name: user?.name || "", email: user?.email || "" },
                theme: { color: "#176c66" },
                handler: async (paymentResponse) => {
                    try {
                        const verification = await api.post("/payments/verify", paymentResponse);
                        await refreshPaymentAccount();
                        setShowPlanPoster(false);
                        setIsPlanPosterMinimized(false);
                        setPaymentMessage(verification.data.message || "Payment verified and trip credits added.");
                    } catch (verificationError) {
                        setPaymentError(
                            verificationError.response?.data?.message
                            || "Payment was received but could not yet be verified. Contact support before retrying."
                        );
                    } finally {
                        setBuyingPackage("");
                    }
                },
                modal: {
                    ondismiss: () => setBuyingPackage(""),
                },
            });
            checkout.on("payment.failed", (failure) => {
                setPaymentError(failure.error?.description || "Test payment was not completed.");
                setBuyingPackage("");
            });
            checkout.open();
        } catch (requestError) {
            setPaymentError(requestError.response?.data?.message || requestError.message || "Unable to start Razorpay Test Mode checkout.");
            setBuyingPackage("");
        }
    };

    const formatInr = (amountPaise) => `₹${(Number(amountPaise || 0) / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;

    const closePlanPoster = () => {
        localStorage.setItem(posterSeenKey, "true");
        localStorage.removeItem(posterMinimizedKey);
        setShowPlanPoster(false);
        setIsPlanPosterMinimized(false);
    };

    const minimizePlanPoster = () => {
        localStorage.setItem(posterMinimizedKey, "true");
        setIsPlanPosterMinimized(true);
    };

    const restorePlanPoster = () => {
        localStorage.removeItem(posterMinimizedKey);
        setIsPlanPosterMinimized(false);
    };

    // ============================
    // FORMAT DATE
    // ============================

    const formatDate = (date) => {

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );

    };

    const mostGenerousPackageCredits = Math.max(
        0,
        ...paymentAccount.packages.map((creditPackage) => creditPackage.credits)
    );


    return (

        <div className="dashboard-page">


            <SiteNavbar />


            {/* ============================
                HEADER
            ============================ */}

            <section className="dashboard-header">

                <div>

                    <p className="dashboard-welcome">
                        Your Travel Dashboard
                    </p>

                    <h1>
                        Welcome, {user?.name} 👋
                    </h1>

                    <p className="dashboard-email">
                        {user?.email}
                    </p>

                </div>


                <button
                    className="create-trip-btn"
                    onClick={() => navigate("/planner")}
                >

                    <Plus size={19} />

                    Plan New Trip

                </button>

            </section>

            <section className="recommendations-section" aria-label="Personalized destination recommendations">
                <div className="recommendations-heading">
                    <div>
                        <p>MADE FOR YOUR NEXT GETAWAY</p>
                        <h2>Recommended for you</h2>
                        <span>Local destination picks shaped by your trip interests, history, and budget.</span>
                    </div>
                    <form
                        className="recommendation-filters"
                        onSubmit={(event) => {
                            event.preventDefault();
                            fetchRecommendations(recommendationBudget, recommendationDays);
                        }}
                    >
                        <label>
                            Budget (₹)
                            <input
                                type="number"
                                min="0"
                                max="100000000"
                                value={recommendationBudget}
                                onChange={(event) => setRecommendationBudget(event.target.value)}
                                placeholder="Use trip history"
                            />
                        </label>
                        <label>
                            Days
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={recommendationDays}
                                onChange={(event) => setRecommendationDays(event.target.value)}
                            />
                        </label>
                        <button type="submit" disabled={recommendationsLoading}>Update</button>
                    </form>
                </div>
                {recommendationsError && <p className="recommendation-error" role="alert">{recommendationsError}</p>}
                {recommendationsLoading ? (
                    <p className="recommendation-empty" role="status">Finding destinations for you...</p>
                ) : recommendations.length ? (
                    <div className="recommendation-grid">
                        {recommendations.map((destination) => {
                            const isSaved = savedPlaces.some((place) => place.toLowerCase() === destination.name.toLowerCase());
                            return (
                                <article className="recommendation-card" key={destination.name}>
                                    <img
                                        className="recommendation-image"
                                        src={getDestinationImage(destination.name, destination.imageUrl)}
                                        alt={`${destination.name} destination`}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(event) => {
                                            if (!event.currentTarget.src.endsWith(destinationFallbackImage)) {
                                                event.currentTarget.src = destinationFallbackImage;
                                            }
                                        }}
                                    />
                                    <div className="recommendation-card-top">
                                        <span>{destination.country}</span>
                                        <button
                                            type="button"
                                            aria-pressed={isSaved}
                                            onClick={() => toggleSavedPlace(destination.name)}
                                        >
                                            {isSaved ? "Saved" : "Save place"}
                                        </button>
                                    </div>
                                    <h3>{destination.name}</h3>
                                    <p>{destination.description}</p>
                                    <p className="recommendation-reason">{destination.reason}</p>
                                    <div className="recommendation-tags">
                                        {destination.interests.slice(0, 3).map((interest) => (
                                            <span key={interest}>{interest}</span>
                                        ))}
                                    </div>
                                    <p className="recommendation-budget">
                                        Est. ₹{Number(destination.estimatedTripBudget).toLocaleString("en-IN")} for {recommendationDays} days
                                    </p>
                                    <button
                                        type="button"
                                        className="recommendation-plan"
                                        onClick={() => navigate(`/planner?destination=${encodeURIComponent(destination.name)}`)}
                                    >
                                        Plan this trip
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="recommendation-empty">No destinations available for these filters yet. Try a larger budget or another trip length.</p>
                )}
            </section>

            {(tripInvitations.length > 0 || invitationsError) && (
                <section className="group-invitations-section" aria-label="Group trip invitations">
                    <div>
                        <p>TRAVEL TOGETHER</p>
                        <h2>Group trip invitations</h2>
                    </div>
                    {invitationsError && <p role="alert">{invitationsError}</p>}
                    {tripInvitations.map((invitation) => (
                        <article key={invitation._id} className="group-invitation-card">
                            <div>
                                <strong>{invitation.destination}</strong>
                                <span>Invited by {invitation.owner?.name || invitation.owner?.email || "a traveler"}</span>
                            </div>
                            <button
                                type="button"
                                disabled={acceptingInvitation === invitation._id}
                                onClick={() => acceptTripInvitation(invitation._id)}
                            >
                                {acceptingInvitation === invitation._id ? "Joining..." : "Accept invitation"}
                            </button>
                        </article>
                    ))}
                </section>
            )}

            {(weatherNotifications.length > 0 || weatherNotificationsError) && (
                <section className="weather-updates-section" aria-label="Weather updates">
                    <div className="weather-updates-heading">
                        <div>
                            <p>SMART TRIP UPDATES</p>
                            <h2>Weather alerts</h2>
                            <span>Forecasts are checked throughout the day for your upcoming trips.</span>
                        </div>
                        <CloudRain size={26} aria-hidden="true" />
                    </div>
                    {weatherNotificationsError && (
                        <p className="weather-updates-error" role="alert">{weatherNotificationsError}</p>
                    )}
                    <div className="weather-updates-list">
                        {weatherNotifications.map((notification) => (
                            <article
                                className={`weather-update-card${notification.read ? " is-read" : ""}`}
                                key={notification._id}
                            >
                                <div className="weather-update-copy">
                                    <div className="weather-update-meta">
                                        <span>{notification.destination}</span>
                                        <span>{formatDate(`${notification.tripDate}T12:00:00`)}</span>
                                    </div>
                                    <h3>{notification.title}</h3>
                                    <p>{notification.message}</p>
                                    {notification.affectedActivities?.length > 0 && (
                                        <p className="weather-affected-activities">
                                            Outdoor plans to review: {notification.affectedActivities.join(", ")}
                                        </p>
                                    )}
                                    {notification.suggestions?.length > 0 && (
                                        <ul>
                                            {notification.suggestions.map((suggestion) => (
                                                <li key={suggestion}>{suggestion}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="weather-update-actions">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/trips/${notification.trip}`)}
                                    >
                                        View trip <ArrowUpRight size={15} aria-hidden="true" />
                                    </button>
                                    {!notification.read && (
                                        <button
                                            type="button"
                                            className="weather-acknowledge"
                                            onClick={() => markWeatherNotificationRead(notification._id)}
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}



            {/* ============================
                STATS
            ============================ */}

            <section className="dashboard-stats">


                <div className="stat-card">

                    <div className="stat-icon">
                        <Compass size={22} />
                    </div>

                    <div>

                        <span>
                            Total Trips
                        </span>

                        <strong>
                            {trips.length}
                        </strong>

                    </div>

                </div>



                <div className="stat-card">

                    <div className="stat-icon">
                        <Heart size={22} />
                    </div>

                    <div>

                        <span>
                            Saved Places
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>



                <div className="stat-card">

                    <div className="stat-icon">
                        <Star size={22} />
                    </div>

                    <div>

                        <span>
                            Reviews
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>


            </section>

            {(paymentError || paymentMessage) && (
                <div className="payment-feedback" aria-live="polite">
                    {paymentError && <p className="payment-notice error" role="alert">{paymentError}</p>}
                    {paymentMessage && <p className="payment-notice success" role="status">{paymentMessage}</p>}
                </div>
            )}

            {paymentAccount.payments.length > 0 && (
                <section className="payment-history-section">
                    <div className="payment-history">
                        <h2>Payment history</h2>
                        <div className="payment-history-table-wrap">
                            <table>
                                <thead><tr><th>Package</th><th>Credits</th><th>Amount</th><th>Status</th><th>Date</th><th>Payment ID</th></tr></thead>
                                <tbody>
                                    {paymentAccount.payments.map((payment) => (
                                        <tr key={payment._id}>
                                            <td>{payment.packageName}</td>
                                            <td>{payment.credits}</td>
                                            <td>{formatInr(payment.amountPaise)}</td>
                                            <td><span className={`payment-status ${payment.status}`}>{payment.status}</span></td>
                                            <td>{payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}</td>
                                            <td>{payment.razorpayPaymentId || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {showPlanPoster && !isPlanPosterMinimized && paymentAccount.packages.length > 0 && (
                <div
                    className="plan-poster-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closePlanPoster();
                    }}
                >
                    <section
                        className="plan-poster"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="plan-poster-title"
                        aria-describedby="plan-poster-description"
                    >
                        <button
                            type="button"
                            className="plan-poster-minimize"
                            onClick={minimizePlanPoster}
                            aria-label="Minimize subscription plans"
                        >
                            <Minus size={19} />
                        </button>
                        <button
                            type="button"
                            className="plan-poster-close"
                            onClick={closePlanPoster}
                            aria-label="Close subscription plans"
                        >
                            <X size={20} />
                        </button>
                        <div className="plan-poster-glow" aria-hidden="true" />
                        <div className="plan-poster-content">
                            <div className="plan-poster-eyebrow">
                                <Crown size={15} />
                                YOUR NEXT JOURNEY, UNLOCKED
                            </div>
                            <h2 id="plan-poster-title">Make room for <span>more wonder.</span></h2>
                            <p id="plan-poster-description" className="plan-poster-description">
                                Add AI trip credits whenever you need them. Choose a travel pass to continue to secure Razorpay Test Mode checkout.
                            </p>
                            {paymentError && <p className="payment-notice error plan-poster-notice" role="alert">{paymentError}</p>}
                            {paymentMessage && <p className="payment-notice success plan-poster-notice" role="status">{paymentMessage}</p>}
                            <div className="plan-poster-perks">
                                <span><Sparkles size={15} /> Personalised AI itineraries</span>
                                <span><ShieldCheck size={15} /> Secure Test Mode checkout opens after selection</span>
                            </div>
                            <div className="plan-poster-packages">
                                {paymentAccount.packages.map((creditPackage) => (
                                    <article
                                        className={`plan-poster-package${creditPackage.credits === mostGenerousPackageCredits ? " featured" : ""}`}
                                        key={creditPackage._id || creditPackage.key}
                                    >
                                        {creditPackage.credits === mostGenerousPackageCredits && (
                                            <span className="plan-poster-ribbon">BEST VALUE</span>
                                        )}
                                        <p>{creditPackage.name}</p>
                                        <strong>{formatInr(creditPackage.amountPaise)}</strong>
                                        <span className="plan-poster-credit-count">
                                            {creditPackage.credits} AI trip{creditPackage.credits === 1 ? "" : "s"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => startPackagePurchase(creditPackage)}
                                            disabled={Boolean(buyingPackage)}
                                        >
                                            {buyingPackage === creditPackage.key ? "Opening checkout..." : "Choose this pass"}
                                            <ArrowRight size={16} />
                                        </button>
                                    </article>
                                ))}
                            </div>
                            <p className="plan-poster-footnote">No subscription auto-renewal. One secure payment, credits for your next trips.</p>
                        </div>
                    </section>
                </div>
            )}

            {showPlanPoster && isPlanPosterMinimized && paymentAccount.packages.length > 0 && (
                <button
                    type="button"
                    className="plan-poster-launcher"
                    onClick={restorePlanPoster}
                    aria-label="Reopen subscription plans"
                >
                    <Crown size={17} />
                    <span>Trip plans</span>
                </button>
            )}



            {/* ============================
                MY TRIPS
            ============================ */}

            <section className="trips-section">


                <div className="section-heading">

                    <div>

                        <h2>
                            My Trips
                        </h2>

                        <p>
                            Your saved travel plans
                        </p>

                    </div>


                    <button
                        type="button"
                        className="new-trip-btn"
                        onClick={startNewTrip}
                    >
                        <Plus size={17} />
                        New Trip
                    </button>

                </div>



                {loading && (

                    <div className="dashboard-message">

                        Loading your trips...

                    </div>

                )}



                {error && !loading && (

                    <div className="dashboard-error">

                        {error}

                    </div>

                )}



                {!loading &&
                    !error &&
                    trips.length === 0 && (

                        <div className="empty-trips">

                            <div className="empty-icon">

                                <Sparkles size={30} />

                            </div>


                            <h3>
                                No trips yet
                            </h3>


                            <p>
                                Start planning your next adventure
                                with our AI travel planner.
                            </p>


                            <button
                                onClick={() =>
                                    navigate("/planner")
                                }
                            >

                                <Sparkles size={17} />

                                Plan Your First Trip

                            </button>

                        </div>

                    )}



                {!loading &&
                    !error &&
                    trips.length > 0 && (

                        <div className="trips-grid">

                            {trips.map((trip) => (

                                            <div
                                                className="trip-card"
                                                key={trip._id}
                                                onClick={() =>
                                                    navigate(`/trips/${trip._id}`)
                                                }
                                            >


                                    {/* Trip Image */}

                                    <div className="trip-image">
                                        <img
                                            src={getDestinationImage(trip.destination)}
                                            alt={`${trip.destination} destination`}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(event) => {
                                                if (!event.currentTarget.src.endsWith(destinationFallbackImage)) {
                                                    event.currentTarget.src = destinationFallbackImage;
                                                }
                                            }}
                                        />

                                        <div className="trip-image-overlay">

                                            <MapPin size={18} />

                                            {trip.destination}

                                        </div>

                                    </div>



                                    {/* Trip Content */}

                                    <div className="trip-content">

                                        <h3>
                                            {trip.destination}
                                        </h3>


                                        <div className="trip-detail">

                                            <CalendarDays
                                                size={17}
                                            />

                                            <span>

                                                {formatDate(
                                                    trip.startDate
                                                )}

                                                {" - "}

                                                {formatDate(
                                                    trip.endDate
                                                )}

                                            </span>

                                        </div>


                                        <div className="trip-detail">

                                            <Users size={17} />

                                            <span>

                                                {trip.travelers}
                                                {" "}
                                                traveler
                                                {trip.travelers > 1
                                                    ? "s"
                                                    : ""
                                                }

                                            </span>

                                        </div>


                                        <div className="trip-detail">

                                            <Wallet size={17} />

                                            <span>
                                                {trip.destinationPackage
                                                    ? `${trip.destinationPackage.currency} ${Number(trip.budget).toLocaleString("en-IN")}`
                                                    : `₹${Number(trip.budget).toLocaleString("en-IN")}`}

                                            </span>

                                        </div>


                                        <div className="trip-tags">

                                            {trip.destinationPackage && (
                                                <span>
                                                    Package trip · {trip.destinationPackage.name}
                                                </span>
                                            )}

                                            <span>
                                                {trip.travelStyle}
                                            </span>


                                            {trip.interests
                                                ?.slice(0, 3)
                                                .map((interest) => (

                                                    <span
                                                        key={interest}
                                                    >
                                                        {interest}
                                                    </span>

                                                ))
                                            }

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

            </section>



            {/* ============================
                QUICK ACTIONS
            ============================ */}

            <section className="quick-section">

                <h2>
                    Quick Actions
                </h2>


                <div className="quick-grid">


                    <button
                        onClick={() =>
                            navigate("/planner")
                        }
                    >

                        <Sparkles size={23} />

                        <div>

                            <strong>
                                AI Trip Planner
                            </strong>

                            <span>
                                Create a personalized itinerary
                            </span>

                        </div>

                    </button>



                    <button
                        onClick={() =>
                            navigate("/explore")
                        }
                    >

                        <Compass size={23} />

                        <div>

                            <strong>
                                Explore Destinations
                            </strong>

                            <span>
                                Discover amazing places
                            </span>

                        </div>

                    </button>


                </div>

            </section>


        </div>

    );

}


export default Dashboard;