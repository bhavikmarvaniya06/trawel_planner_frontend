import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanelBoundary from "./components/AdminPanelBoundary";
import FeedbackWidget from "./components/FeedbackWidget";
import SiteFooter from "./components/SiteFooter";

const Login = lazy(() => import(/* webpackPrefetch: true */ "./pages/Login"));
const Home = lazy(() => import(/* webpackPrefetch: true */ "./pages/Home"));
const Explore = lazy(() => import(/* webpackPrefetch: true */ "./pages/Explore"));
const About = lazy(() => import(/* webpackPrefetch: true */ "./pages/About"));
const Planner = lazy(() => import(/* webpackPrefetch: true */ "./pages/Planner"));
const Register = lazy(() => import(/* webpackPrefetch: true */ "./pages/Register"));
const Dashboard = lazy(() => import(/* webpackPrefetch: true */ "./pages/Dashboard"));
const TripDetails = lazy(() => import(/* webpackPrefetch: true */ "./pages/TripDetails"));
const Contact = lazy(() => import(/* webpackPrefetch: true */ "./pages/Contact"));
const Privacy = lazy(() => import(/* webpackPrefetch: true */ "./pages/Privacy"));
const Terms = lazy(() => import(/* webpackPrefetch: true */ "./pages/Terms"));
const AdminDashboard = lazy(() => import(/* webpackPrefetch: true */ "./pages/AdminCollectionsDashboard"));

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="page-loading" role="status">
            <Sparkles size={20} aria-hidden="true" />
            <span>Preparing your next journey...</span>
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />
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
      <SiteFooter />
      <FeedbackWidget />
    </BrowserRouter>
  );
}

export default App;
