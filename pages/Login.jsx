import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Sparkles } from "lucide-react";

import { useAuth } from "../context/AuthContext";

import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await login(email, password);

            navigate(response.user.role === "admin" ? "/admin" : "/dashboard");

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Login failed"
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-logo">
                    ✈ TripAI
                </div>

                <div className="auth-icon">
                    <Sparkles size={25} />
                </div>

                <h1>
                    Welcome back
                </h1>

                <p className="auth-subtitle">
                    Login to continue planning your trips.
                </p>


                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}


                <form onSubmit={handleSubmit}>

                    <div className="input-group">

                        <label>
                            Email
                        </label>

                        <div className="input-wrapper">

                            <Mail size={18} />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />

                        </div>

                    </div>


                    <div className="input-group">

                        <label>
                            Password
                        </label>

                        <div className="input-wrapper">

                            <Lock size={18} />

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                        </div>

                    </div>


                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"
                        }

                    </button>

                </form>


                <p className="auth-footer">

                    Don't have an account?

                    <Link to="/register">
                        Create account
                    </Link>

                </p>

                <div className="auth-footer-row">
                    <p className="auth-footer alt-link">
                        <Link to="/">Go to Home</Link>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Login;