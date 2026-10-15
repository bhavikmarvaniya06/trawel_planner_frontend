import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Map as MapIcon, MessageSquareText, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminRecordsTable from "../components/AdminRecordsTable";

import "./AdminDashboard.css";

const views = [
    ["trips", "Trips"],
    ["users", "Users"],
    ["queries", "Customer queries"],
    ["feedback", "Feedback"],
    ["destinations", "Destinations"],
    ["itineraries", "Trip itinerary"],
];
const endpoints = { users: "users", trips: "trips", queries: "queries", feedback: "feedback", destinations: "destinations", itineraries: "itineraries", expenses: "expenses" };
const responseKeys = { users: "user", trips: "trip", queries: "query", feedback: "feedback", destinations: "destination", itineraries: "itinerary", expenses: "expense" };
const labels = Object.fromEntries(views);
const singularLabels = { users: "user", trips: "trip", queries: "customer query", feedback: "feedback", destinations: "destination", itineraries: "itinerary item", expenses: "expense" };

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
    const [data, setData] = useState({ users: [], trips: [], queries: [], feedback: [], destinations: [], itineraries: [], expenses: [] });
    const [stats, setStats] = useState({ totalUsers: 0, tripCount: 0, averageRating: 0, budgetSummary: [] });
    const [selectedView, setSelectedView] = useState("trips");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ status: "", rating: "", destination: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialog, setDialog] = useState(null);
    const [form, setForm] = useState({});

    const loadDashboard = useCallback(async () => {
        try {
            const response = await api.get("/admin/dashboard");
            const result = response.data;
            setData({
                users: result.users || [], trips: result.trips || [], queries: result.queries || [],
                feedback: result.feedback || [], destinations: result.destinations || [],
                itineraries: result.itineraries || [], expenses: result.expenses || [],
            });
            setStats(result.stats || { totalUsers: result.users?.length || 0, tripCount: result.trips?.length || 0, averageRating: 0, budgetSummary: [] });
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
                ["owner", "Traveler", (row) => row.user?.name || "Deleted user"],
                ["dates", "Travel dates", (row) => `${dateValue(row.startDate)} - ${dateValue(row.endDate)}`],
                ["status", "Status", (row) => row.status || "planned"],
                ["budget", "Budget", (row) => moneyValue(row.budget, row.currency), (row) => Number(row.budget) || 0],
            ],
            users: [["name", "Name", (row) => row.name], ["email", "Email", (row) => row.email], ["role", "Role", (row) => row.role], ["joined", "Joined", (row) => dateValue(row.createdAt), (row) => new Date(row.createdAt).getTime()]],
            queries: [["name", "Name", (row) => row.name], ["email", "Email", (row) => row.email], ["query", "Query", (row) => row.query], ["status", "Status", (row) => row.status || "open"], ["received", "Received", (row) => dateValue(row.createdAt, true), (row) => new Date(row.createdAt).getTime()]],
            feedback: [["name", "Name", (row) => row.name], ["rating", "Rating", (row) => `${row.rating}/5`, (row) => Number(row.rating)], ["message", "Feedback", (row) => row.message], ["trip", "Trip", (row) => tripName(row.trip) || row.page || "General"], ["received", "Received", (row) => dateValue(row.createdAt, true), (row) => new Date(row.createdAt).getTime()]],
            destinations: [["name", "Destination", (row) => <button type="button" className="destination-itinerary-link" onClick={() => { setSelectedView("itineraries"); setFilters((current) => ({ ...current, destination: row.name })); }}>{row.name}</button>], ["usersPlanned", "Users planned", (row) => `${row.usersPlanned} ${row.usersPlanned === 1 ? "user" : "users"}`, (row) => row.usersPlanned], ["active", "Status", (row) => row.active ? "Active" : "Inactive"]],
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
            destinations: { name: current.name || "", country: current.country || "", region: current.region || "", description: current.description || "", currency: current.currency || "USD", active: current.active ?? true },
            itineraries: { trip: current.trip?._id || "", day: current.day || 1, date: current.date?.slice(0, 10) || "", title: current.title || "", estimatedCost: current.estimatedCost ?? 0, activities: JSON.stringify(current.activities || [], null, 2) },
            expenses: { trip: current.trip?._id || "", category: current.category || "", description: current.description || "", amount: current.amount ?? 0, currency: current.currency || "USD", date: current.date?.slice(0, 10) || new Date().toISOString().slice(0, 10) },
        };
        setForm(initial[selectedView]);
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
        if (type === "destinations") payload.active = Boolean(payload.active);
        try {
            const path = `/admin/${endpoints[type]}${dialog.mode === "edit" ? `/${dialog.record._id}` : ""}`;
            const response = dialog.mode === "edit" ? await api.put(path, payload) : await api.post(path, payload);
            const updated = response.data[responseKeys[type]];
            setData((previous) => ({
                ...previous,
                [type]: dialog.mode === "edit"
                    ? previous[type].map((item) => item._id === updated._id ? updated : item)
                    : [updated, ...previous[type]],
            }));
            setDialog(null);
            setForm({});
            if (["trips", "users", "feedback", "expenses"].includes(type)) await loadDashboard();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to save changes");
        } finally {
            setSaving(false);
        }
    };

    const signOut = () => { logout(); navigate("/login"); };
    const canCreate = ["feedback", "destinations", "itineraries", "expenses"].includes(selectedView);
    const canEdit = true;
    const statusOptions = selectedView === "trips"
        ? [["planned", "Planned"], ["booked", "Booked"], ["completed", "Completed"], ["cancelled", "Cancelled"]]
        : [["open", "Open"], ["in_progress", "In progress"], ["resolved", "Resolved"]];

    if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

    return (
        <div className="admin-page">
            <header className="admin-topbar">
                <div className="admin-brand"><MapIcon size={20} /> TripAI <span>Admin</span></div>
                <span className="admin-nav-label">Operations workspace</span>
                <button className="admin-logout" onClick={signOut}><LogOut size={16} /> Logout</button>
            </header>
            <main className="admin-container">
                <div className="admin-main-panel">
                    <p className="admin-label">TRIPAI / ADMIN</p>
                    <h1>Travel operations</h1>
                    <p className="admin-intro">Manage travelers, trips, destinations, and trip operations.</p>
                    {error && <div className="admin-error" role="alert">{error}</div>}
                    <section className="admin-stats" aria-label="Dashboard summaries">
                        <div><Users size={20} /><strong>{stats.totalUsers}</strong><span>Total users</span></div>
                        <div><MapIcon size={20} /><strong>{stats.tripCount}</strong><span>Total trips</span></div>
                        <div><MessageSquareText size={20} /><strong>{Number(stats.averageRating).toFixed(1)} / 5</strong><span>Average rating</span></div>
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
                            {canCreate && <button type="button" className="edit-save-button" onClick={() => openEditor(null, true)}>Add {selectedView === "itineraries" ? "itinerary item" : selectedView === "expenses" ? "expense" : selectedView === "destinations" ? "destination" : "feedback"}</button>}
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
                            onDelete={selectedView === "itineraries" && !filters.destination ? null : (record) => removeRecord(record)}
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
                        {dialog.type === "destinations" && <><Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><div className="edit-form-row"><Field label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} /><Field label="Region" value={form.region} onChange={(value) => setForm({ ...form, region: value })} /></div><Field label="Description" multiline value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><Field label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value.toUpperCase() })} maxLength="3" /><SelectField label="Availability" value={String(form.active)} options={[["true", "Active"], ["false", "Inactive"]]} onChange={(value) => setForm({ ...form, active: value === "true" })} /></>}
                        {dialog.type === "itineraries" && <><SelectField label="Trip" value={form.trip} options={data.trips.map((trip) => [trip._id, trip.destination])} onChange={(value) => setForm({ ...form, trip: value })} required /><div className="edit-form-row"><Field label="Day" type="number" min="1" value={form.day} onChange={(value) => setForm({ ...form, day: value })} required /><Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} required /></div><Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required /><Field label="Estimated cost" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(value) => setForm({ ...form, estimatedCost: value })} /><Field label="Activities (JSON array)" multiline value={form.activities} onChange={(value) => setForm({ ...form, activities: value })} /></>}
                        {dialog.type === "expenses" && <><SelectField label="Trip" value={form.trip} options={data.trips.map((trip) => [trip._id, trip.destination])} onChange={(value) => setForm({ ...form, trip: value })} required /><Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} required /><Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><div className="edit-form-row"><Field label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} required /><Field label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value.toUpperCase() })} maxLength="3" /></div><Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} required /></>}
                        <div className="edit-modal-actions"><button type="button" className="edit-cancel-button" onClick={() => setDialog(null)} disabled={saving}>Cancel</button><button type="submit" className="edit-save-button" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
                    </form>}
                </section>
            </div>}
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
