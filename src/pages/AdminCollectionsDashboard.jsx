import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, LogOut, Map as MapIcon, MessageSquareText, Search, Sparkles, Users, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminRecordsTable from "../components/AdminRecordsTable";
import AdminAiAssistant from "../components/AdminAiAssistant";

import "./AdminDashboard.css";

const views = [
    ["trips", "Trips"],
    ["users", "Users"],
    ["queries", "Customer queries"],
    ["feedback", "Feedback"],
    ["destinations", "Destinations"],
    ["itineraries", "Trip itinerary"],
    ["payments", "Payments"],
];
const endpoints = { users: "users", trips: "trips", queries: "queries", feedback: "feedback", destinations: "destinations", itineraries: "itineraries", expenses: "expenses" };
const responseKeys = { users: "user", trips: "trip", queries: "query", feedback: "feedback", destinations: "destination", itineraries: "itinerary", expenses: "expense" };
const labels = Object.fromEntries(views);
const singularLabels = { users: "user", trips: "trip", queries: "customer query", feedback: "feedback", destinations: "destination", itineraries: "itinerary item", expenses: "expense", payments: "payment" };

const dateValue = (value, withTime = false) => value ? new Date(value).toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }) : "—";
const moneyValue = (amount, currency = "USD") => {
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(Number(amount) || 0);
    } catch {
        return `${currency || "USD"} ${(Number(amount) || 0).toLocaleString()}`;
    }
};
const tripName = (trip) => typeof trip === "object" && trip ? trip.destination : "";

function AdminCollectionsDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [data, setData] = useState({ users: [], trips: [], queries: [], feedback: [], destinations: [], itineraries: [], expenses: [], payments: [] });
    const [packages, setPackages] = useState([]);
    const [packagePrices, setPackagePrices] = useState({});
    const [savingPackage, setSavingPackage] = useState("");
    const [stats, setStats] = useState({ totalUsers: 0, tripCount: 0, averageRating: 0, budgetSummary: [], revenuePaise: 0, paidPaymentCount: 0, totalTripCredits: 0 });
    const [selectedView, setSelectedView] = useState("trips");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ status: "", rating: "", destination: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialog, setDialog] = useState(null);
    const [form, setForm] = useState({});
    const [destinationImageFiles, setDestinationImageFiles] = useState([]);
    const [assistantOpen, setAssistantOpen] = useState(false);

    const loadDashboard = useCallback(async () => {
        try {
            const response = await api.get("/admin/dashboard");
            const result = response.data;
            setData({
                users: result.users || [], trips: result.trips || [], queries: result.queries || [],
                feedback: result.feedback || [], destinations: result.destinations || [],
                itineraries: result.itineraries || [], expenses: result.expenses || [], payments: result.payments || [],
            });
            const loadedPackages = result.packages || [];
            setPackages(loadedPackages);
            setPackagePrices(Object.fromEntries(loadedPackages.map((item) => [item._id, (item.amountPaise / 100).toFixed(2)])));
            setStats(result.stats || { totalUsers: result.users?.length || 0, tripCount: result.trips?.length || 0, averageRating: 0, budgetSummary: [], revenuePaise: 0, paidPaymentCount: 0, totalTripCredits: 0 });
            setError("");
        } catch (requestError) {
            if ([401, 403].includes(requestError.response?.status)) {
                navigate("/");
                return;
            }
            setError(requestError.response?.data?.message || "Unable to load admin dashboard");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const itinerarySummaries = useMemo(() => {
        const groups = new Map();
        data.itineraries.forEach((item) => {
            const destination = tripName(item.trip);
            if (!destination) return;
            const summary = groups.get(destination) || {
                _id: `destination:${destination}`,
                destination,
                tripIds: new Set(),
                plannedDays: new Set(),
            };
            const tripId = item.trip?._id || String(item.trip);
            summary.tripIds.add(tripId);
            summary.plannedDays.add(`${tripId}:${item.day}`);
            groups.set(destination, summary);
        });
        return Array.from(groups.values())
            .map((summary) => ({
                _id: summary._id,
                destination: summary.destination,
                tripCount: summary.tripIds.size,
                plannedDays: summary.plannedDays.size,
            }))
            .sort((left, right) => left.destination.localeCompare(right.destination));
    }, [data.itineraries]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        const rows = selectedView === "itineraries" && !filters.destination
            ? itinerarySummaries
            : data[selectedView];
        return rows.map((record) => {
            if (selectedView !== "destinations") return record;
            const userIds = new Set(data.trips
                .filter((trip) => trip.destination?.trim().toLowerCase() === record.name?.trim().toLowerCase())
                .map((trip) => trip.user?._id || trip.user)
                .filter(Boolean)
                .map(String));
            return { ...record, usersPlanned: userIds.size };
        }).filter((record) => {
            const searchable = JSON.stringify({ ...record, user: record.user?.name, trip: tripName(record.trip) }).toLowerCase();
            if (query && !searchable.includes(query)) return false;
            if (selectedView === "trips" && filters.status && record.status !== filters.status) return false;
            if (selectedView === "queries" && filters.status && (record.status || "open") !== filters.status) return false;
            if (selectedView === "feedback" && filters.rating && record.rating !== Number(filters.rating)) return false;
            if (selectedView === "trips" && filters.destination && record.destination !== filters.destination) return false;
            if (["itineraries", "feedback"].includes(selectedView) && filters.destination && tripName(record.trip) !== filters.destination) return false;
            return true;
        });
    }, [data, selectedView, search, filters, itinerarySummaries]);

    const columns = useMemo(() => {
        const definitions = {
            trips: [
                ["destination", "Destination", (row) => row.destination],
                ["destinationPackage", "Destination package", (row) => row.destinationPackage?.name || "AI / custom trip"],
                ["owner", "Traveler", (row) => row.user?.name || "Deleted user"],
                ["dates", "Travel dates", (row) => `${dateValue(row.startDate)} - ${dateValue(row.endDate)}`],
                ["status", "Status", (row) => row.status || "planned"],
                ["budget", "Budget", (row) => moneyValue(row.budget, row.currency), (row) => Number(row.budget) || 0],
            ],
            users: [["name", "Name", (row) => row.name], ["email", "Email", (row) => row.email], ["role", "Role", (row) => row.role], ["freeTrip", "Free trip", (row) => row.freeTripUsed ? "Used" : "Available"], ["tripCredits", "Trip credits", (row) => Number(row.tripCredits) || 0, (row) => Number(row.tripCredits) || 0], ["joined", "Joined", (row) => dateValue(row.createdAt), (row) => new Date(row.createdAt).getTime()]],
            payments: [
                ["user", "User", (row) => row.user?.name || row.user?.email || "Deleted user"],
                ["package", "Package", (row) => row.packageName],
                ["credits", "Trip credits", (row) => row.credits, (row) => Number(row.credits)],
                ["amount", "Amount", (row) => moneyValue(row.amountPaise / 100, row.currency), (row) => Number(row.amountPaise)],
                ["status", "Status", (row) => row.status],
                ["paymentId", "Razorpay payment ID", (row) => row.razorpayPaymentId || "—"],
                ["paidAt", "Paid at", (row) => dateValue(row.paidAt || row.createdAt, true), (row) => new Date(row.paidAt || row.createdAt).getTime()],
            ],
            queries: [["name", "Name", (row) => row.name], ["email", "Email", (row) => row.email], ["query", "Query", (row) => row.query], ["status", "Status", (row) => row.status || "open"], ["received", "Received", (row) => dateValue(row.createdAt, true), (row) => new Date(row.createdAt).getTime()]],
            feedback: [["name", "Name", (row) => row.name], ["rating", "Rating", (row) => `${row.rating}/5`, (row) => Number(row.rating)], ["message", "Feedback", (row) => row.message], ["trip", "Trip", (row) => tripName(row.trip) || row.page || "General"], ["received", "Received", (row) => dateValue(row.createdAt, true), (row) => new Date(row.createdAt).getTime()]],
            destinations: [["name", "Destination", (row) => <button type="button" className="destination-itinerary-link" onClick={() => { setSelectedView("itineraries"); setFilters((current) => ({ ...current, destination: row.name })); }}>{row.name}</button>], ["location", "Location", (row) => row.location || [row.region, row.country].filter(Boolean).join(", ") || "—"], ["price", "Price", (row) => moneyValue(row.price, row.currency), (row) => Number(row.price) || 0], ["duration", "Duration", (row) => `${row.durationDays || 1} days`, (row) => Number(row.durationDays) || 1], ["active", "Status", (row) => row.active ? "Published" : "Unpublished"]],
            itineraries: filters.destination
                ? [["day", "Day", (row) => row.day, (row) => Number(row.day)], ["date", "Date", (row) => dateValue(row.date), (row) => new Date(row.date).getTime()], ["title", "Plan", (row) => row.title], ["activities", "Activities", (row) => (row.activities || []).map((activity) => activity.title || activity.name || "Activity").join(", ") || "—"]]
                : [["destination", "Destination", (row) => <button type="button" className="destination-itinerary-link" onClick={() => setFilters((current) => ({ ...current, destination: row.destination }))}>{row.destination}</button>], ["plannedDays", "Itinerary days", (row) => `${row.plannedDays} ${row.plannedDays === 1 ? "day" : "days"}`, (row) => row.plannedDays], ["tripCount", "Trips", (row) => row.tripCount, (row) => row.tripCount]],
        };
        return definitions[selectedView].map(([key, label, render, sortValue]) => ({ key, label, getValue: render, getSortValue: sortValue }));
    }, [selectedView, filters.destination]);

    const tableRows = filteredRows.map((record) => ({
        ...record,
        _record: record,
        _label: record.destination || record.name || record.title || record.category || labels[selectedView],
        ...Object.fromEntries(columns.map((column) => [column.key, {
            display: column.getValue(record) ?? "—",
            sortValue: column.getSortValue ? column.getSortValue(record) : column.getValue(record) ?? "",
        }])),
    }));

    const openEditor = (record, create = false) => {
        setError("");
        setDialog({ mode: create ? "create" : "edit", type: selectedView, record: record || null });
        const current = record || {};
        const initial = {
            users: { name: current.name || "", email: current.email || "", role: current.role || "user" },
            trips: { destination: current.destination || "", startDate: current.startDate?.slice(0, 10) || "", endDate: current.endDate?.slice(0, 10) || "", travelers: current.travelers || 1, budget: current.budget ?? 0, travelStyle: current.travelStyle || "balanced", interests: (current.interests || []).join(", "), status: current.status || "planned", currency: current.currency || "USD" },
            queries: { name: current.name || "", email: current.email || "", query: current.query || "", status: current.status || "open" },
            feedback: { name: current.name || "", email: current.email || "", rating: current.rating || 5, message: current.message || "", page: current.page || "", trip: current.trip?._id || "" },
            destinations: {
                name: current.name || "",
                country: current.country || "",
                region: current.region || "",
                location: current.location || "",
                description: current.description || "",
                imageUrl: current.imageUrl || "",
                currency: current.currency || "USD",
                price: current.price ?? 0,
                durationDays: current.durationDays ?? 1,
                itinerary: JSON.stringify(current.itinerary || [], null, 2),
                bookingAvailable: current.bookingDetails?.available ?? true,
                bookingUrl: current.bookingDetails?.bookingUrl || "",
                contactEmail: current.bookingDetails?.contactEmail || "",
                contactPhone: current.bookingDetails?.contactPhone || "",
                bookingNotes: current.bookingDetails?.notes || "",
                active: current.active ?? true,
            },
            itineraries: { trip: current.trip?._id || "", day: current.day || 1, date: current.date?.slice(0, 10) || "", title: current.title || "", estimatedCost: current.estimatedCost ?? 0, activities: JSON.stringify(current.activities || [], null, 2) },
            expenses: { trip: current.trip?._id || "", category: current.category || "", description: current.description || "", amount: current.amount ?? 0, currency: current.currency || "USD", date: current.date?.slice(0, 10) || new Date().toISOString().slice(0, 10) },
        };
        setDestinationImageFiles([]);
        setForm(initial[selectedView]);
    };

    const removeDestinationImage = async (record, image) => {
        try {
            await api.delete(`/admin/destinations/${record._id}/images/${image._id}`);
            setDialog((current) => current?.record?._id === record._id
                ? {
                    ...current,
                    record: {
                        ...current.record,
                        images: (current.record.images || []).filter((item) => item._id !== image._id),
                    },
                }
                : current);
            setData((previous) => ({
                ...previous,
                destinations: previous.destinations.map((destination) => (
                    destination._id === record._id
                        ? { ...destination, images: destination.images.filter((item) => item._id !== image._id) }
                        : destination
                )),
            }));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to remove destination image.");
        }
    };

    const removeRecord = async (record) => {
        const label = record.destination || record.name || record.title || record.category || labels[selectedView];
        if (!window.confirm(`Delete ${label}?${selectedView === "trips" ? " Its itinerary, expenses, and trip-specific feedback will also be deleted." : selectedView === "users" ? " Their trips and related records will also be deleted." : ""}`)) return;
        try {
            await api.delete(`/admin/${endpoints[selectedView]}/${record._id}`);
            if (selectedView === "users") {
                const tripIds = data.trips.filter((trip) => trip.user?._id === record._id).map((trip) => trip._id);
                setData((previous) => ({
                    ...previous,
                    users: previous.users.filter((item) => item._id !== record._id),
                    trips: previous.trips.filter((item) => item.user?._id !== record._id),
                    itineraries: previous.itineraries.filter((item) => !tripIds.includes(item.trip?._id)),
                    expenses: previous.expenses.filter((item) => !tripIds.includes(item.trip?._id)),
                    feedback: previous.feedback.filter((item) => !tripIds.includes(item.trip?._id)),
                }));
            } else {
                const key = selectedView;
                setData((previous) => ({ ...previous, [key]: previous[key].filter((item) => item._id !== record._id) }));
                if (selectedView === "trips") {
                    setData((previous) => ({ ...previous, itineraries: previous.itineraries.filter((item) => item.trip?._id !== record._id), expenses: previous.expenses.filter((item) => item.trip?._id !== record._id), feedback: previous.feedback.filter((item) => item.trip?._id !== record._id) }));
                }
            }
            await loadDashboard();
            setError("");
        } catch (requestError) {
            setError(requestError.response?.data?.message || `Unable to delete ${labels[selectedView].toLowerCase()}`);
        }
    };

    const saveRecord = async (event) => {
        event.preventDefault();
        if (!dialog) return;
        setSaving(true);
        setError("");
        const type = dialog.type;
        const payload = { ...form };
        if (["trips", "itineraries", "expenses", "feedback"].includes(type) && payload.trip === "") payload.trip = null;
        if (type === "trips") {
            payload.travelers = Number(payload.travelers);
            payload.budget = Number(payload.budget);
            payload.interests = payload.interests.split(",").map((item) => item.trim()).filter(Boolean);
        }
        if (type === "feedback") payload.rating = Number(payload.rating);
        if (type === "itineraries") {
            payload.day = Number(payload.day);
            payload.estimatedCost = Number(payload.estimatedCost);
            try { payload.activities = JSON.parse(payload.activities || "[]"); } catch { setError("Activities must be valid JSON."); setSaving(false); return; }
        }
        if (type === "expenses") payload.amount = Number(payload.amount);
        if (type === "destinations") {
            payload.active = Boolean(payload.active);
            payload.price = Number(payload.price);
            payload.durationDays = Number(payload.durationDays);
            try {
                payload.itinerary = JSON.parse(payload.itinerary || "[]");
            } catch {
                setError("Itinerary must be valid JSON.");
                setSaving(false);
                return;
            }
            payload.bookingDetails = {
                available: payload.bookingAvailable,
                bookingUrl: payload.bookingUrl,
                contactEmail: payload.contactEmail,
                contactPhone: payload.contactPhone,
                notes: payload.bookingNotes,
            };
            delete payload.bookingAvailable;
            delete payload.bookingUrl;
            delete payload.contactEmail;
            delete payload.contactPhone;
            delete payload.bookingNotes;
        }
        try {
            const path = `/admin/${endpoints[type]}${dialog.mode === "edit" ? `/${dialog.record._id}` : ""}`;
            const response = dialog.mode === "edit" ? await api.put(path, payload) : await api.post(path, payload);
            const updated = response.data[responseKeys[type]];
            if (type === "destinations" && destinationImageFiles.length > 0) {
                setDialog({ mode: "edit", type, record: updated });
            }
            if (type === "destinations" && destinationImageFiles.length > 0) {
                const imageForm = new FormData();
                destinationImageFiles.forEach((file) => imageForm.append("images", file));
                await api.post(`/admin/destinations/${updated._id}/images`, imageForm, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            setData((previous) => ({
                ...previous,
                [type]: dialog.mode === "edit"
                    ? previous[type].map((item) => item._id === updated._id ? updated : item)
                    : [updated, ...previous[type]],
            }));
            setDialog(null);
            setForm({});
            setDestinationImageFiles([]);
            if (["trips", "users", "feedback", "expenses", "destinations"].includes(type)) await loadDashboard();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to save changes");
        } finally {
            setSaving(false);
        }
    };

    const signOut = () => { logout(); navigate("/login"); };
    const canCreate = ["feedback", "destinations", "itineraries", "expenses"].includes(selectedView);
    const canEdit = selectedView !== "payments";
    const statusOptions = selectedView === "trips"
        ? [["planned", "Planned"], ["booked", "Booked"], ["completed", "Completed"], ["cancelled", "Cancelled"]]
        : [["open", "Open"], ["in_progress", "In progress"], ["resolved", "Resolved"]];

    const savePackagePrice = async (creditPackage) => {
        const price = Number(packagePrices[creditPackage._id]);
        const amountPaise = Math.round(price * 100);
        if (!Number.isFinite(price) || amountPaise < 100) {
            setError("Enter a valid package price of at least ₹1.");
            return;
        }
        setSavingPackage(creditPackage._id);
        setError("");
        try {
            const response = await api.put(`/admin/payment-packages/${creditPackage._id}`, { amountPaise });
            setPackages((previous) => previous.map((item) => item._id === creditPackage._id ? response.data.package : item));
            setPackagePrices((previous) => ({ ...previous, [creditPackage._id]: (response.data.package.amountPaise / 100).toFixed(2) }));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to update package pricing.");
        } finally {
            setSavingPackage("");
        }
    };

    if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

    return (
        <div className="admin-page">
            <header className="admin-topbar">
                <div className="admin-brand"><MapIcon size={20} /> TripAI <span>Admin</span></div>
                <span className="admin-nav-label">Operations workspace</span>
                <button type="button" className="admin-ai-toggle-btn" onClick={() => setAssistantOpen(true)}>
                    <Sparkles size={16} /> AI Operations Assistant
                </button>
                <button className="admin-logout" onClick={signOut}><LogOut size={16} /> Logout</button>
            </header>
            <main className="admin-container">
                <div className="admin-main-panel">
                    <p className="admin-label">TRIPAI / ADMIN</p>
                    <h1>Travel operations</h1>
                    <p className="admin-intro">Manage travelers, trips, and the featured destinations shown on user dashboards.</p>
                    {error && <div className="admin-error" role="alert">{error}</div>}
                    <section className="admin-stats" aria-label="Dashboard summaries">
                        <div><Users size={20} /><strong>{stats.totalUsers}</strong><span>Total users</span></div>
                        <div><MapIcon size={20} /><strong>{stats.tripCount}</strong><span>Total trips</span></div>
                        <div><MessageSquareText size={20} /><strong>{Number(stats.averageRating).toFixed(1)} / 5</strong><span>Average rating</span></div>
                        <div><CreditCard size={20} /><strong>{moneyValue(stats.revenuePaise / 100, "INR")}</strong><span>Verified revenue ({stats.paidPaymentCount} payments)</span></div>
                        <div><Wallet size={20} /><strong>{stats.totalTripCredits}</strong><span>Unspent user credits</span></div>
                    </section>
                    <section className="admin-section admin-pricing-section">
                        <div className="section-heading">
                            <h2>AI trip package pricing</h2>
                            <span>Prices are managed in INR</span>
                        </div>
                        <div className="admin-table-wrap">
                            <table className="admin-table admin-pricing-table">
                                <thead><tr><th>Package</th><th>Credits</th><th>Price (₹)</th><th>Status</th><th>Update</th></tr></thead>
                                <tbody>
                                    {packages.map((creditPackage) => (
                                        <tr key={creditPackage._id}>
                                            <td>{creditPackage.name}</td>
                                            <td>{creditPackage.credits}</td>
                                            <td>
                                                <input
                                                    aria-label={`${creditPackage.name} price in rupees`}
                                                    type="number"
                                                    min="1"
                                                    step="0.01"
                                                    value={packagePrices[creditPackage._id] || ""}
                                                    onChange={(event) => setPackagePrices((previous) => ({ ...previous, [creditPackage._id]: event.target.value }))}
                                                />
                                            </td>
                                            <td>{creditPackage.active ? "Active" : "Inactive"}</td>
                                            <td><button type="button" className="record-action-btn edit-action" onClick={() => savePackagePrice(creditPackage)} disabled={savingPackage === creditPackage._id}>{savingPackage === creditPackage._id ? "Saving..." : "Save price"}</button></td>
                                        </tr>
                                    ))}
                                    {packages.length === 0 && <tr><td colSpan="5" className="admin-empty-row">No credit packages configured.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section className="admin-section">
                        <nav className="admin-collection-tabs" aria-label="Collections">
                            {views.map(([key, label]) => <button type="button" key={key} className={selectedView === key ? "collection-tab active" : "collection-tab"} onClick={() => { setSelectedView(key); setFilters({ status: "", rating: "", destination: "" }); }}>{label}<span>{data[key].length}</span></button>)}
                        </nav>
                        <div className="collection-toolbar">
                            <div className="sidebar-search"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${labels[selectedView].toLowerCase()}`} /></div>
                            {selectedView === "trips" && <select aria-label="Filter trips by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All trip statuses</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
                            {selectedView === "queries" && <select aria-label="Filter queries by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All query statuses</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
                            {selectedView === "feedback" && <select aria-label="Filter feedback by rating" value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select>}
                            {["trips", "itineraries", "feedback"].includes(selectedView) && <select aria-label="Filter by destination" value={filters.destination} onChange={(event) => setFilters({ ...filters, destination: event.target.value })}><option value="">All destinations</option>{[...new Set(data.trips.map((trip) => trip.destination))].sort().map((destination) => <option key={destination} value={destination}>{destination}</option>)}</select>}
                            <div className="collection-result-count">{filteredRows.length} records</div>
                            {canCreate && <button type="button" className="edit-save-button" onClick={() => openEditor(null, true)}>Add {selectedView === "itineraries" ? "itinerary item" : selectedView === "expenses" ? "expense" : selectedView === "destinations" ? "destination package" : "feedback"}</button>}
                        </div>
                        {selectedView === "itineraries" && <nav className="itinerary-destination-list" aria-label="Itinerary destinations">
                            <button type="button" className={!filters.destination ? "itinerary-destination active" : "itinerary-destination"} onClick={() => setFilters({ ...filters, destination: "" })}>All destinations <span>{itinerarySummaries.length}</span></button>
                            {[...new Set(data.itineraries.map((item) => tripName(item.trip)).filter(Boolean))].sort().map((destination) => {
                                const count = data.itineraries.filter((item) => tripName(item.trip) === destination).length;
                                return <button type="button" key={destination} className={filters.destination === destination ? "itinerary-destination active" : "itinerary-destination"} onClick={() => setFilters({ ...filters, destination })}>{destination} <span>{count}</span></button>;
                            })}
                        </nav>}
                        <AdminRecordsTable
                            rows={tableRows}
                            columns={columns.map(({ key, label }) => ({ key, label }))}
                            onView={(record) => selectedView === "itineraries" && !filters.destination
                                ? setFilters((current) => ({ ...current, destination: record.destination }))
                                : setDialog({ mode: "view", type: selectedView, record })}
                            onEdit={canEdit && !(selectedView === "itineraries" && !filters.destination) ? (record) => openEditor(record) : null}
                            onDelete={selectedView === "payments" || (selectedView === "itineraries" && !filters.destination) ? null : (record) => removeRecord(record)}
                        />
                    </section>
                </div>
            </main>
            {dialog && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialog(null); }}>
                <section className="admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
                    <div className="edit-modal-heading"><h2 id="admin-dialog-title">{dialog.mode === "view" ? labels[dialog.type] : `${dialog.mode === "create" ? "Add" : "Edit"} ${singularLabels[dialog.type]}`}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setDialog(null)}>×</button></div>
                    {dialog.mode === "view" ? <dl className="admin-record-details">{Object.entries(dialog.record).filter(([key]) => !["_id", "__v", "password", "legacyKey"].includes(key)).map(([key, value]) => <div key={key}><dt>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</dt><dd>{value && typeof value === "object" ? (value.destination || value.name || JSON.stringify(value)) : String(value ?? "—")}</dd></div>)}</dl> : <form onSubmit={saveRecord}>
                        {dialog.type === "users" && <><Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /><SelectField label="Role" value={form.role} options={[["user", "User"], ["admin", "Admin"]]} onChange={(value) => setForm({ ...form, role: value })} /></>}
                        {dialog.type === "trips" && <><Field label="Destination" value={form.destination} onChange={(value) => setForm({ ...form, destination: value })} required /><div className="edit-form-row"><Field label="Start date" type="date" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} required /><Field label="End date" type="date" value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} required /></div><div className="edit-form-row"><Field label="Travelers" type="number" min="1" value={form.travelers} onChange={(value) => setForm({ ...form, travelers: value })} required /><Field label="Budget" type="number" min="0" step="0.01" value={form.budget} onChange={(value) => setForm({ ...form, budget: value })} required /></div><div className="edit-form-row"><SelectField label="Status" value={form.status} options={[["planned", "Planned"], ["booked", "Booked"], ["completed", "Completed"], ["cancelled", "Cancelled"]]} onChange={(value) => setForm({ ...form, status: value })} /><Field label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value.toUpperCase() })} maxLength="3" /></div><Field label="Interests (comma-separated)" value={form.interests} onChange={(value) => setForm({ ...form, interests: value })} /></>}
                        {dialog.type === "queries" && <><Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /><Field label="Query" multiline value={form.query} onChange={(value) => setForm({ ...form, query: value })} required /><SelectField label="Status" value={form.status} options={statusOptions} onChange={(value) => setForm({ ...form, status: value })} /></>}
                        {dialog.type === "feedback" && <><Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /><SelectField label="Rating" value={form.rating} options={[5, 4, 3, 2, 1].map((rating) => [rating, `${rating} stars`])} onChange={(value) => setForm({ ...form, rating: value })} /><Field label="Message" multiline value={form.message} onChange={(value) => setForm({ ...form, message: value })} required /><Field label="Page" value={form.page} onChange={(value) => setForm({ ...form, page: value })} /><SelectField label="Trip (optional)" value={form.trip} options={[["", "General feedback"], ...data.trips.map((trip) => [trip._id, trip.destination])]} onChange={(value) => setForm({ ...form, trip: value })} /></>}
                        {dialog.type === "destinations" && <>
                            <Field label="Destination name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required maxLength="120" />
                            <div className="edit-form-row">
                                <Field label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} />
                                <Field label="Region" value={form.region} onChange={(value) => setForm({ ...form, region: value })} />
                            </div>
                            <Field label="Location / address" value={form.location} onChange={(value) => setForm({ ...form, location: value })} maxLength="200" />
                            <Field label="Description" multiline value={form.description} onChange={(value) => setForm({ ...form, description: value })} maxLength="2000" />
                            <Field label="Cover image URL (optional)" type="url" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} maxLength="2048" />
                            <div className="edit-form-row">
                                <Field label="Price per traveler" type="number" min="0" step="0.01" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
                                <Field label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value.toUpperCase() })} maxLength="3" required />
                                <Field label="Duration (days)" type="number" min="1" max="30" value={form.durationDays} onChange={(value) => setForm({ ...form, durationDays: value })} required />
                            </div>
                            <Field label="Itinerary (JSON array: day, title, description, activities)" multiline value={form.itinerary} onChange={(value) => setForm({ ...form, itinerary: value })} />
                            <SelectField label="Bookings available" value={String(form.bookingAvailable)} options={[["true", "Available"], ["false", "Unavailable"]]} onChange={(value) => setForm({ ...form, bookingAvailable: value === "true" })} />
                            <Field label="Provider booking URL (optional)" type="url" value={form.bookingUrl} onChange={(value) => setForm({ ...form, bookingUrl: value })} maxLength="2048" />
                            <div className="edit-form-row">
                                <Field label="Booking contact email" type="email" value={form.contactEmail} onChange={(value) => setForm({ ...form, contactEmail: value })} />
                                <Field label="Booking contact phone" type="tel" value={form.contactPhone} onChange={(value) => setForm({ ...form, contactPhone: value })} maxLength="40" />
                            </div>
                            <Field label="Booking details / notes" multiline value={form.bookingNotes} onChange={(value) => setForm({ ...form, bookingNotes: value })} maxLength="1000" />
                            <SelectField label="Publication" value={String(form.active)} options={[["true", "Published"], ["false", "Unpublished"]]} onChange={(value) => setForm({ ...form, active: value === "true" })} />
                            {dialog.record?.images?.length > 0 && (
                                <div className="destination-admin-images">
                                    <strong>Uploaded images</strong>
                                    {dialog.record.images.map((image) => (
                                        <div key={image._id}>
                                            <span>{image.filename || image.contentType}</span>
                                            <button type="button" className="record-action-btn danger" onClick={() => removeDestinationImage(dialog.record, image)} disabled={saving}>
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(dialog.record?.images?.length || 0) + destinationImageFiles.length < 10 && (
                                <label className="destination-image-upload">
                                    Add photos (JPG, PNG, WebP; max 1 MB each; up to 10 total)
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={(event) => {
                                            const selected = Array.from(event.target.files || []);
                                            const existingCount = dialog.record?.images?.length || 0;
                                            if (existingCount + selected.length > 10) {
                                                setError("A destination can have at most 10 uploaded images.");
                                                setDestinationImageFiles([]);
                                                return;
                                            }
                                            if (selected.some((file) => file.size > 1024 * 1024)) {
                                                setError("Each destination image must be 1 MB or smaller.");
                                                setDestinationImageFiles([]);
                                                return;
                                            }
                                            setError("");
                                            setDestinationImageFiles(selected);
                                        }}
                                    />
                                    {destinationImageFiles.map((file) => <small key={`${file.name}-${file.lastModified}`}>{file.name}</small>)}
                                </label>
                            )}
                        </>}
                        {dialog.type === "itineraries" && <><SelectField label="Trip" value={form.trip} options={data.trips.map((trip) => [trip._id, trip.destination])} onChange={(value) => setForm({ ...form, trip: value })} required /><div className="edit-form-row"><Field label="Day" type="number" min="1" value={form.day} onChange={(value) => setForm({ ...form, day: value })} required /><Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} required /></div><Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required /><Field label="Estimated cost" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(value) => setForm({ ...form, estimatedCost: value })} /><Field label="Activities (JSON array)" multiline value={form.activities} onChange={(value) => setForm({ ...form, activities: value })} /></>}
                        {dialog.type === "expenses" && <><SelectField label="Trip" value={form.trip} options={data.trips.map((trip) => [trip._id, trip.destination])} onChange={(value) => setForm({ ...form, trip: value })} required /><Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} required /><Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><div className="edit-form-row"><Field label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} required /><Field label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value.toUpperCase() })} maxLength="3" /></div><Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} required /></>}
                        <div className="edit-modal-actions"><button type="button" className="edit-cancel-button" onClick={() => setDialog(null)} disabled={saving}>Cancel</button><button type="submit" className="edit-save-button" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
                    </form>}
                </section>
            </div>}
            <AdminAiAssistant
                isOpen={assistantOpen}
                onClose={() => setAssistantOpen(false)}
                onActionExecuted={loadDashboard}
            />
        </div>
    );
}

function Field({ label, value, onChange, type = "text", multiline = false, ...props }) {
    const Component = multiline ? "textarea" : "input";
    return <label>{label}<Component type={multiline ? undefined : type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}

function SelectField({ label, value, options, onChange, required = false }) {
    return <label>{label}<select value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

export default AdminCollectionsDashboard;
