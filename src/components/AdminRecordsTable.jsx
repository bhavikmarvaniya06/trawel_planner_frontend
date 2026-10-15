import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 10;

function AdminRecordsTable({ rows, columns, onView, onEdit, onDelete }) {
    const [sort, setSort] = useState({ key: columns[0]?.key || "", direction: "asc" });
    const [page, setPage] = useState(1);

    const sortedRows = useMemo(() => [...rows].sort((left, right) => {
        const a = left[sort.key]?.sortValue ?? left[sort.key]?.value ?? left[sort.key] ?? "";
        const b = right[sort.key]?.sortValue ?? right[sort.key]?.value ?? right[sort.key] ?? "";
        const comparison = typeof a === "number" && typeof b === "number"
            ? a - b
            : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
        return sort.direction === "asc" ? comparison : -comparison;
    }), [rows, sort]);
    const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const visibleRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const toggleSort = (key) => {
        setSort((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    return (
        <>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} aria-sort={sort.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
                                    <button type="button" className="table-sort-button" onClick={() => toggleSort(column.key)}>
                                        {column.label}{sort.key === column.key ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                </th>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((row) => (
                            <tr key={row._id}>
                                {columns.map((column) => <td key={column.key}>{row[column.key]?.display ?? row[column.key] ?? "—"}</td>)}
                                <td>
                                    <div className="record-actions">
                                        <button type="button" className="record-action-btn" title="View record" aria-label={`View ${row._label || "record"}`} onClick={() => onView(row._record || row)}><Eye size={15} /> View</button>
                                        {onEdit && <button type="button" className="record-action-btn edit-action" title="Edit record" aria-label={`Edit ${row._label || "record"}`} onClick={() => onEdit(row._record || row)}><Pencil size={15} /> Edit</button>}
                                        {onDelete && <button type="button" className="record-action-btn danger" title="Delete record" aria-label={`Delete ${row._label || "record"}`} onClick={() => onDelete(row._record || row)}><Trash2 size={15} /> Delete</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {visibleRows.length === 0 && <tr><td colSpan={columns.length + 1} className="admin-empty-row">No matching records.</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="admin-pagination" aria-label="Table pagination">
                <span>{sortedRows.length ? `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, sortedRows.length)} of ${sortedRows.length}` : "0 records"}</span>
                <div>
                    <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>Previous</button>
                    <span>Page {currentPage} of {pageCount}</span>
                    <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage === pageCount}>Next</button>
                </div>
            </div>
        </>
    );
}

export default AdminRecordsTable;
