import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminPanelBoundary() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="admin-loading">Loading...</div>;
    }

    if (user?.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
}

export default AdminPanelBoundary;
