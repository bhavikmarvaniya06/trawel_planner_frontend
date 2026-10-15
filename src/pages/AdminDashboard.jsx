import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Map, MessageSquareText, Pencil, Search, Trash2, Users, X } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [users, setUsers] = useState([]);
    const [trips, setTrips] = useState([]);
    const [queries, setQueries] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [selectedView, setSelectedView] = useState("users");
    const [searchTerm, setSearchTerm] = useState("");
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [savingEdit, setSavingEdit] = useState(false);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredUsers = normalizedSearch
        ? users.filter((user) => {
              const name = (user.name || "").toLowerCase();
              const email = (user.email || "").toLowerCase();
              return name.includes(normalizedSearch) || email.includes(normalizedSearch);
          })
        : users;

    const filteredTrips = normalizedSearch
        ? trips.filter((trip) => {
              const ownerName = (trip.user?.name || "").toLowerCase();
              const ownerEmail = (trip.user?.email || "").toLowerCase();
              return ownerName.includes(normalizedSearch) || ownerEmail.includes(normalizedSearch);
          })
        : trips;

    const filteredQueries = normalizedSearch
        ? queries.filter((queryEntry) => {
              const name = (queryEntry.name || "").toLowerCase();
              const email = (queryEntry.email || "").toLowerCase();
              const message = (queryEntry.query || "").toLowerCase();
              return name.includes(normalizedSearch) || email.includes(normalizedSearch) || message.includes(normalizedSearch);
          })
        : queries;

    const filteredFeedback = normalizedSearch
        ? feedback.filter((entry) => {
              const name = (entry.name || "").toLowerCase();
              const email = (entry.email || "").toLowerCase();
              const message = (entry.message || "").toLowerCase();
              return name.includes(normalizedSearch) || email.includes(normalizedSearch) || message.includes(normalizedSearch);
          })
        : feedback;

    const matchedUser = normalizedSearch
        ? users.find((user) => {
              const name = (user.name || "").toLowerCase();
              const email = (user.email || "").toLowerCase();
              return name.includes(normalizedSearch) || email.includes(normalizedSearch);
          })
        : null;

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const response = await api.get("/admin/dashboard");
                setUsers(response.data.users);
                setTrips(response.data.trips);
                setQueries(response.data.queries || []);
                setFeedback(response.data.feedback || []);
            } catch (requestError) {
                if ([401, 403].includes(requestError.response?.status)) {
                    navigate("/");
                    return;
                }
                setError(requestError.response?.data?.message || "Unable to load admin dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    const removeUser = async (id) => {
        if (!window.confirm("Delete this user and all of their trips?")) return;

        try {
            await api.delete(`/admin/users/${id}`);
            setUsers((currentUsers) => currentUsers.filter((user) => user._id !== id));
            setTrips((currentTrips) => currentTrips.filter((trip) => trip.user?._id !== id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to delete user");
        }
    };

    const removeTrip = async (id) => {
        if (!window.confirm("Delete this trip?")) return;

        try {
            await api.delete(`/admin/trips/${id}`);
            setTrips((currentTrips) => currentTrips.filter((trip) => trip._id !== id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to delete trip");
        }
    };

    const removeQuery = async (id) => {
        if (!window.confirm("Delete this customer query?")) return;

        try {
            await api.delete(`/admin/queries/${id}`);
            setQueries((currentQueries) => currentQueries.filter((queryEntry) => queryEntry._id !== id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to delete customer query");
        }
    };

    const openEditor = (type, record) => {
        setError("");
        setEditingRecord({ type, record });

        if (type === "users") {
            setEditForm({ name: record.name, email: record.email, role: record.role });
        } else if (type === "trips") {
            setEditForm({
                destination: record.destination,
                startDate: new Date(record.startDate).toISOString().slice(0, 10),
                endDate: new Date(record.endDate).toISOString().slice(0, 10),
                travelers: record.travelers,
                budget: record.budget,
                travelStyle: record.travelStyle || "balanced",
                interests: (record.interests || []).join(", "),
            });
        } else {
            setEditForm({ name: record.name, email: record.email, query: record.query });
        }
    };

    const closeEditor = () => {
        if (savingEdit) return;
        setEditingRecord(null);
        setEditForm({});
    };

    const saveEdit = async (event) => {
        event.preventDefault();
        if (!editingRecord) return;

        setSavingEdit(true);
        setError("");
        const payload = editingRecord.type === "trips"
            ? {
                  ...editForm,
                  travelers: Number(editForm.travelers),
                  budget: Number(editForm.budget),
                  interests: editForm.interests.split(",").map((interest) => interest.trim()).filter(Boolean),
              }
            : editForm;

        try {
            const response = await api.put(
                `/admin/${editingRecord.type}/${editingRecord.record._id}`,
                payload
            );

            if (editingRecord.type === "users") {
                setUsers((currentUsers) =>
                    currentUsers.map((user) => user._id === response.data.user._id ? response.data.user : user)
                );
            } else if (editingRecord.type === "trips") {
                setTrips((currentTrips) =>
                    currentTrips.map((trip) => trip._id === response.data.trip._id ? response.data.trip : trip)
                );
            } else {
                setQueries((currentQueries) =>
                    currentQueries.map((queryEntry) =>
                        queryEntry._id === response.data.query._id ? response.data.query : queryEntry
                    )
                );
            }

            setEditingRecord(null);
            setEditForm({});
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to save changes");
        } finally {
            setSavingEdit(false);
        }
    };

    const signOut = () => {
        logout();
        navigate("/login");
    };

    if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

    return (
        <div className="admin-page">
            <div className="admin-topbar">
                <div className="admin-brand"><span>✈</span> TripAI</div>
                <span className="admin-nav-label">Admin workspace</span>
                <button className="admin-logout" onClick={signOut}><LogOut size={16} /> Logout</button>
            </div>

            <main className="admin-container">
                <div className="admin-shell">
                    <aside className="admin-sidebar">
                        <div className="sidebar-search">
                            <Search size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search records"
                            />
                        </div>

                        <div className="sidebar-actions">
                            <button
                                type="button"
                                className={selectedView === "users" ? "sidebar-btn active" : "sidebar-btn"}
                                onClick={() => setSelectedView("users")}
                            >
                                Show all users
                            </button>

                            <button
                                type="button"
                                className={selectedView === "trips" ? "sidebar-btn active" : "sidebar-btn"}
                                onClick={() => setSelectedView("trips")}
                            >
                                Show all user's trips
                            </button>

                            <button
                                type="button"
                                className={selectedView === "queries" ? "sidebar-btn active" : "sidebar-btn"}
                                onClick={() => setSelectedView("queries")}
                            >
                                Show all customer queries
                            </button>

                            <button
                                type="button"
                                className={selectedView === "feedback" ? "sidebar-btn active" : "sidebar-btn"}
                                onClick={() => setSelectedView("feedback")}
                            >
                                Show all feedback
                            </button>
                        </div>

                        {searchTerm && (
                            <div className="sidebar-search-result">
                                {matchedUser ? (
                                    <>
                                        <p className="search-result-label">User profile</p>
                                        <h3>{matchedUser.name}</h3>
                                        <p>{matchedUser.email}</p>
                                        <p className="search-role">{matchedUser.role}</p>

                                        <div className="trip-summary">
                                            <p className="search-result-label">Booked trips</p>
                                            {filteredTrips.length > 0 ? (
                                                <ul>
                                                    {filteredTrips.map((trip) => (
                                                        <li key={trip._id}>
                                                            <strong>{trip.destination}</strong>
                                                            <span>
                                                                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                                            </span>
                                                            <span>${Number(trip.budget).toLocaleString()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="empty-search">No trips found for this user.</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="empty-search">No user found for this search.</p>
                                )}
                            </div>
                        )}
                    </aside>

                    <div className="admin-main-panel">
                        <p className="admin-label">ADMIN PANEL</p>
                        <h1>Manage TripAI</h1>
                        <p className="admin-intro">Review accounts and keep the community's travel plans healthy.</p>
                        {error && <div className="admin-error">{error}</div>}

                        <div className="admin-stats">
                            <div><Users size={20} /><strong>{users.length}</strong><span>Registered users</span></div>
                            <div><Map size={20} /><strong>{trips.length}</strong><span>Planned trips</span></div>
                            <div className="admin-stat-wide"><Users size={20} /><strong>{queries.length}</strong><span>Customer queries</span></div>
                            <div className="admin-stat-wide"><MessageSquareText size={20} /><strong>{feedback.length}</strong><span>User feedback</span></div>
                        </div>

                        <section className="admin-section">
                            <div className="section-heading">
                                <h2>
                                    {selectedView === "users" && "Users"}
                                    {selectedView === "trips" && "Trips"}
                                    {selectedView === "queries" && "Customer queries"}
                                    {selectedView === "feedback" && "User feedback"}
                                </h2>
                                <span>
                                    {selectedView === "users" && `${filteredUsers.length} total`}
                                    {selectedView === "trips" && `${filteredTrips.length} total`}
                                    {selectedView === "queries" && `${filteredQueries.length} total`}
                                    {selectedView === "feedback" && `${filteredFeedback.length} total`}
                                </span>
                            </div>

                            <div className="admin-table-wrap">
                                {selectedView === "users" && (
                                    <table className="admin-table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td><span className={`role ${user.role}`}>{user.role}</span></td>
                                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="record-actions">
                                                            <button type="button" className="record-action-btn edit-action" title="Edit user" aria-label={`Edit ${user.name}`} onClick={() => openEditor("users", user)}><Pencil size={15} /> Edit</button>
                                                            <button type="button" className="record-action-btn danger" title="Delete user" aria-label={`Delete ${user.name}`} onClick={() => removeUser(user._id)}><Trash2 size={15} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedView === "trips" && (
                                    <table className="admin-table">
                                        <thead><tr><th>Destination</th><th>Owner</th><th>Dates</th><th>Budget</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredTrips.map((trip) => (
                                                <tr key={trip._id}>
                                                    <td className="destination-cell">{trip.destination}</td>
                                                    <td>{trip.user?.name || "Deleted user"}<small>{trip.user?.email || ""}</small></td>
                                                    <td>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</td>
                                                    <td>${Number(trip.budget).toLocaleString()}</td>
                                                    <td>
                                                        <div className="record-actions">
                                                            <button type="button" className="record-action-btn edit-action" title="Edit trip" aria-label={`Edit trip to ${trip.destination}`} onClick={() => openEditor("trips", trip)}><Pencil size={15} /> Edit</button>
                                                            <button type="button" className="record-action-btn danger" title="Delete trip" aria-label={`Delete trip to ${trip.destination}`} onClick={() => removeTrip(trip._id)}><Trash2 size={15} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedView === "queries" && (
                                    <table className="admin-table admin-queries-table">
                                        <thead><tr><th>Name</th><th className="query-email-column">Email</th><th>Query</th><th>Received</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredQueries.map((queryEntry) => (
                                                <tr key={queryEntry._id}>
                                                    <td>{queryEntry.name}</td>
                                                    <td className="query-email-column">{queryEntry.email}</td>
                                                    <td className="query-cell">{queryEntry.query}</td>
                                                    <td>{new Date(queryEntry.createdAt).toLocaleString()}</td>
                                                    <td>
                                                        <div className="record-actions">
                                                            <button type="button" className="record-action-btn edit-action" title="Edit query" aria-label={`Edit query from ${queryEntry.name}`} onClick={() => openEditor("queries", queryEntry)}><Pencil size={15} /> Edit</button>
                                                            <button type="button" className="record-action-btn danger" title="Delete query" aria-label={`Delete query from ${queryEntry.name}`} onClick={() => removeQuery(queryEntry._id)}><Trash2 size={15} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedView === "feedback" && (
                                    <table className="admin-table admin-feedback-table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Rating</th><th>Feedback</th><th>Page</th><th>Received</th></tr></thead>
                                        <tbody>
                                            {filteredFeedback.map((entry) => (
                                                <tr key={entry._id}>
                                                    <td>{entry.name}</td>
                                                    <td className="feedback-email-cell">{entry.email}</td>
                                                    <td><span className="feedback-rating-cell" aria-label={`${entry.rating} out of 5 stars`}>{"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)} <small>{entry.rating}/5</small></span></td>
                                                    <td className="feedback-message-cell">{entry.message}</td>
                                                    <td className="feedback-page-cell">{entry.page || "—"}</td>
                                                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {editingRecord && (
                <div className="admin-modal-backdrop">
                    <section className="admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-record-title">
                        <div className="edit-modal-heading">
                            <h2 id="edit-record-title">
                                Edit {editingRecord.type === "users" ? "user" : editingRecord.type === "trips" ? "trip" : "customer query"}
                            </h2>
                            <button type="button" className="icon-button" aria-label="Close editor" onClick={closeEditor} disabled={savingEdit}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={saveEdit}>
                            {editingRecord.type === "users" && (
                                <>
                                    <label>
                                        Name
                                        <input type="text" required value={editForm.name || ""} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                                    </label>
                                    <label>
                                        Email
                                        <input type="email" required value={editForm.email || ""} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
                                    </label>
                                    <label>
                                        Role
                                        <select value={editForm.role || "user"} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </label>
                                </>
                            )}

                            {editingRecord.type === "trips" && (
                                <>
                                    <label>
                                        Destination
                                        <input type="text" required value={editForm.destination || ""} onChange={(event) => setEditForm({ ...editForm, destination: event.target.value })} />
                                    </label>
                                    <div className="edit-form-row">
                                        <label>
                                            Start date
                                            <input type="date" required value={editForm.startDate || ""} onChange={(event) => setEditForm({ ...editForm, startDate: event.target.value })} />
                                        </label>
                                        <label>
                                            End date
                                            <input type="date" required value={editForm.endDate || ""} onChange={(event) => setEditForm({ ...editForm, endDate: event.target.value })} />
                                        </label>
                                    </div>
                                    <div className="edit-form-row">
                                        <label>
                                            Travelers
                                            <input type="number" min="1" step="1" required value={editForm.travelers ?? ""} onChange={(event) => setEditForm({ ...editForm, travelers: event.target.value })} />
                                        </label>
                                        <label>
                                            Budget
                                            <input type="number" min="0" step="0.01" required value={editForm.budget ?? ""} onChange={(event) => setEditForm({ ...editForm, budget: event.target.value })} />
                                        </label>
                                    </div>
                                    <label>
                                        Travel style
                                        <select value={editForm.travelStyle || "balanced"} onChange={(event) => setEditForm({ ...editForm, travelStyle: event.target.value })}>
                                            {["balanced", "adventure", "relaxing", "family", "luxury", "budget", "romantic"].map((style) => (
                                                <option key={style} value={style}>{style[0].toUpperCase() + style.slice(1)}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Interests <span>(comma-separated)</span>
                                        <input type="text" value={editForm.interests || ""} onChange={(event) => setEditForm({ ...editForm, interests: event.target.value })} />
                                    </label>
                                </>
                            )}

                            {editingRecord.type === "queries" && (
                                <>
                                    <label>
                                        Name
                                        <input type="text" required value={editForm.name || ""} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                                    </label>
                                    <label>
                                        Email
                                        <input type="email" required value={editForm.email || ""} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
                                    </label>
                                    <label>
                                        Query
                                        <textarea required rows="5" value={editForm.query || ""} onChange={(event) => setEditForm({ ...editForm, query: event.target.value })} />
                                    </label>
                                </>
                            )}

                            <div className="edit-modal-actions">
                                <button type="button" className="edit-cancel-button" onClick={closeEditor} disabled={savingEdit}>Cancel</button>
                                <button type="submit" className="edit-save-button" disabled={savingEdit}>{savingEdit ? "Saving..." : "Save changes"}</button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
