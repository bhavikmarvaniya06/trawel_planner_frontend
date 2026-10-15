import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Sparkles } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Login.css";

function OtpLogin() {
    const navigate = useNavigate();
    const { requestOtp, loginWithOtp } = useAuth();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loadingAction, setLoadingAction] = useState("");

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setLoadingAction("sending");

        try {
            const response = await requestOtp(email);
            setOtpSent(true);
            setOtp("");
            setMessage(response.message || "OTP sent to your email address.");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message || "Unable to send OTP right now."
            );
        } finally {
            setLoadingAction("");
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setLoadingAction("verifying");

        try {
            const response = await loginWithOtp(email, otp);
            const destination = response.user.role === "admin" ? "/admin" : "/dashboard";
            navigate(destination);
        } catch (verifyError) {
            setError(
                verifyError.response?.data?.message || "OTP verification failed."
            );
        } finally {
            setLoadingAction("");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo"><span>✈</span> TripAI</div>

                <div className="auth-icon">
                    <Sparkles size={25} />
                </div>

                <h1>Login with OTP</h1>

                <p className="auth-subtitle">
                    Enter your registered email to receive a one-time code.
                </p>

                {error && <div className="auth-error">{error}</div>}
                {message && !error && <div className="auth-success">{message}</div>}

                <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
                    <div className="input-group">
                        <label>Email</label>

                        <div className="input-wrapper">
                            <Mail size={18} />

                            <input
                                type="email"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setOtpSent(false);
                                    setOtp("");
                                    setMessage("");
                                    setError("");
                                }}
                                required
                            />
                        </div>
                    </div>

                    {otpSent && (
                        <div className="input-group">
                            <label>OTP</label>

                            <div className="input-wrapper">
                                <KeyRound size={18} />

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(event) =>
                                        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="auth-button" disabled={Boolean(loadingAction)}>
                        {loadingAction
                            ? loadingAction === "verifying"
                                ? "Verifying..."
                                : "Sending OTP..."
                            : otpSent
                                ? "Verify & Login"
                                : "Send OTP"
                        }
                    </button>

                    {otpSent && (
                        <button
                            type="button"
                            className="secondary-link-btn"
                            onClick={handleRequestOtp}
                            disabled={Boolean(loadingAction)}
                        >
                            {loadingAction === "sending" ? "Resending..." : "Resend OTP"}
                        </button>
                    )}
                </form>

                <div className="auth-footer-row">
                    <p className="auth-footer alt-link">
                        <Link to="/">Go to Home</Link>
                    </p>

                    <p className="auth-footer alt-link">
                        <Link to="/login">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default OtpLogin;
