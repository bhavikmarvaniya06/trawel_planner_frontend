import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigationLinks = [
    { label: "Home", path: "/home", end: true },
    { label: "Explore", path: "/explore" },
    { label: "About", path: "/about" },
    { label: "AI Planner", path: "/planner" },
    { label: "Contact", path: "/contact" },
];

function SiteNavbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="site-header">
            <nav className="site-navbar" aria-label="Main navigation">
                <Link to="/home" className="site-brand">
                    <span className="site-brand-mark">✈</span> TripAI
                </Link>

                <div className="site-nav-links">
                    {navigationLinks.map(({ label, path, end }) => (
                        <NavLink key={path} to={path} end={end}>
                            {label}
                        </NavLink>
                    ))}
                </div>

                <div className="site-nav-actions">
                    {user ? (
                        <button type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    ) : (
                        <>
                            <Link to="/login" className="site-login-btn">
                                Login
                            </Link>
                            <Link to="/register" className="site-signup-btn">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default SiteNavbar;
