import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function SiteFooter() {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const hiddenRoutes = ["/login", "/register", "/admin"];

    if (hiddenRoutes.includes(pathname)) return null;

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <div className="site-footer-brand">
                    <Link to="/home" className="site-footer-logo">
                        <span className="site-brand-mark">✦</span>
                        TripAI
                    </Link>
                    <p>Thoughtful journeys, made personal.</p>
                </div>

                <nav className="site-footer-links" aria-label="Footer navigation">
                    <Link to="/explore">Explore</Link>
                    <Link to="/about">Our story</Link>
                    {user && <Link to="/contact">Contact</Link>}
                    {user && user.role !== "admin" && (
                        <Link to="/planner">
                            <Sparkles size={14} />
                            Plan a trip
                        </Link>
                    )}
                </nav>

                <div className="site-footer-meta">
                    <span>© {new Date().getFullYear()} TripAI</span>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                    <a href="#top" aria-label="Back to top">
                        Back to top <ArrowUpRight size={14} />
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default SiteFooter;
