import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Planner from "./pages/Planner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TripDetails from "./pages/TripDetails";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* HOME */}
                <Route
                    path="/"
                    element={<Home />}
                />


                {/* EXPLORE */}
                <Route
                    path="/explore"
                    element={<Explore />}
                />


                {/* ABOUT */}
                <Route
                    path="/about"
                    element={<About />}
                />


                {/* CONTACT */}
                <Route
                    path="/contact"
                    element={<Contact />}
                />


                {/* PRIVACY */}
                <Route
                    path="/privacy"
                    element={<Privacy />}
                />


                {/* TERMS */}
                <Route
                    path="/terms"
                    element={<Terms />}
                />


                {/* AI PLANNER */}
                <Route
                    path="/planner"
                    element={<Planner />}
                />


                {/* LOGIN */}
                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* REGISTER */}
                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* DASHBOARD */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* ADMIN DASHBOARD */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />


                {/* TRIP DETAILS */}
                <Route
                    path="/trips/:id"
                    element={
                        <ProtectedRoute>
                            <TripDetails />
                        </ProtectedRoute>
                    }
                />


            </Routes>

        </BrowserRouter>

    );

}


export default App;