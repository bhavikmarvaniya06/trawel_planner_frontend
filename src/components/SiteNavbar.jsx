import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Crown, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navigationLinks = [
    { label: "Home", path: "/home", end: true },
    { label: "Explore", path: "/explore" },
    { label: "Our story", path: "/about" },
    { label: "AI Planner", path: "/planner" },
];

function SiteNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!menuOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        closeMenu();
        navigate("/login");
    };

    const renderLinks = () => (
        <>
            {navigationLinks.map(({ label, path, end }) => (
                <NavLink key={path} to={path} end={end} onClick={closeMenu}>
                    {label}
                </NavLink>
            ))}
            {user && user.role !== "admin" && (
                <NavLink to="/dashboard" onClick={closeMenu}>My Trips</NavLink>
            )}
            {user?.role === "admin" && (
                <NavLink to="/admin" onClick={closeMenu}>Admin Panel</NavLink>
            )}
        </>
    );

    return (
        <header className="site-header" id="top">
            <nav className="site-navbar" aria-label="Main navigation">
                <Link to="/home" className="site-brand">
                    <span className="site-brand-mark">✈</span> TripAI
                </Link>

                <div className="site-nav-links">
                    {renderLinks()}
                </div>

                <div className="site-nav-actions">
                    {user ? (
                        <>
                            {user.role !== "admin" && (
                                <Link
                                    to="/dashboard?plans=show"
                                    className="site-trip-pass-action"
                                    onClick={closeMenu}
                                >
                                    <Crown size={14} aria-hidden="true" />
                                    <span>Trip Pass</span>
                                </Link>
                            )}
                            <button type="button" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
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
                    <button
                        type="button"
                        className="site-mobile-toggle"
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={menuOpen}
                        aria-controls="site-mobile-menu"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>
            <div
                id="site-mobile-menu"
                className={`site-mobile-menu${menuOpen ? " is-open" : ""}`}
                aria-hidden={!menuOpen}
                inert={!menuOpen}
            >
                <nav className="site-mobile-links" aria-label="Mobile navigation">
                    {renderLinks()}
                </nav>
                <div className="site-mobile-actions">
                    {user ? (
                        <button type="button" onClick={handleLogout}>Log out</button>
                    ) : (
                        <>
                            <Link to="/login" onClick={closeMenu}>Log in</Link>
                            <Link to="/register" onClick={closeMenu}>Create account</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default SiteNavbar;
