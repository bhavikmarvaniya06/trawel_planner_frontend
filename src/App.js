import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanelBoundary from "./components/AdminPanelBoundary";
import FeedbackWidget from "./components/FeedbackWidget";

const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const About = lazy(() => import("./pages/About"));
const Planner = lazy(() => import("./pages/Planner"));
const OtpLogin = lazy(() => import("./pages/OtpLogin"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TripDetails = lazy(() => import("./pages/TripDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AdminDashboard = lazy(() => import("./pages/AdminCollectionsDashboard"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div role="status" style={{ padding: "2rem", textAlign: "center" }}>Loading page...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/otp-login" element={<OtpLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route element={<ProtectedRoute><AdminPanelBoundary /></ProtectedRoute>}>
            <Route path="/planner" element={<Planner />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trips/:id" element={<TripDetails />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <FeedbackWidget />
    </BrowserRouter>
  );
}

export default App;
