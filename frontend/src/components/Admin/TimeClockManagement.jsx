import { useEffect, useMemo, useRef, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const TimeClockManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [serverDate, setServerDate] = useState(new Date().toISOString());
  const [boardDate, setBoardDate] = useState(() => new Date().toISOString().slice(0, 10));
  const dateInputRef = useRef(null);

  const token = localStorage.getItem("userToken");

  const baseHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const formatDateOnly = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchBoard = async (dateValue = boardDate) => {
    setLoading(true);
    setError("");
    try {
      const query = dateValue ? `?date=${encodeURIComponent(dateValue)}` : "";
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/time-clock/board/today${query}`, {
        headers: baseHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load employee time clock.");
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      if (data?.selectedDate) {
        setServerDate(data.selectedDate);
        setBoardDate(new Date(data.selectedDate).toISOString().slice(0, 10));
      } else if (data?.date) {
        setServerDate(data.date);
      }
    } catch (err) {
      setError(err.message || "Failed to load employee time clock.");
    } finally {
      setLoading(false);
    }
  };

  const clockAction = async (employeeUserId, action) => {
    if (!employeeUserId) return;
    setActionLoadingId(`${employeeUserId}:${action}`);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/time-clock/board/${action}`,
        {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({ employeeUserId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Failed to ${action.replace("-", " ")}.`);
      await fetchBoard();
    } catch (err) {
      setError(err.message || `Failed to ${action.replace("-", " ")}.`);
    } finally {
      setActionLoadingId("");
    }
  };

  useEffect(() => {
    fetchBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Employee Time Clock</h1>
        <div className="text-right text-sm text-gray-600">
          <div className="mb-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                const input = dateInputRef.current;
                if (!input) return;
                if (typeof input.showPicker === "function") {
                  input.showPicker();
                  return;
                }
                input.click();
              }}
              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold hover:bg-gray-50"
              title="Open calendar"
              aria-label="Open calendar"
            >
              <FaCalendarAlt />
              <span>Calendar</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={boardDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                setBoardDate(nextDate);
                fetchBoard(nextDate);
              }}
              className="rounded border px-2 py-1 text-xs"
            />
          </div>
          <div className="font-semibold">Selected Day</div>
          <div>{formatDateOnly(serverDate)}</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Clock In / Clock Out</h2>
          <button
            type="button"
            onClick={fetchBoard}
            className="rounded border px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Clock In</th>
                <th className="px-3 py-2">Clock Out</th>
                <th className="px-3 py-2">Hours Today</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={7}>
                    Loading time clock board...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => {
                  const inAction = actionLoadingId === `${row._id}:clock-in`;
                  const outAction = actionLoadingId === `${row._id}:clock-out`;
                  return (
                    <tr key={row._id} className="border-b">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-600">{row.email}</div>
                      </td>
                      <td className="px-3 py-2 capitalize">{String(row.employeeRole || "").replace(/_/g, " ")}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.isClockedIn
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {row.isClockedIn ? "Clocked In" : "Clocked Out"}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatDateTime(row.lastClockInAt)}</td>
                      <td className="px-3 py-2">{formatDateTime(row.lastClockOutAt)}</td>
                      <td className="px-3 py-2 font-semibold">{Number(row.todaysHours || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => clockAction(row._id, "clock-in")}
                            disabled={row.isClockedIn || Boolean(actionLoadingId)}
                            className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {inAction ? "Clocking In..." : "Clock In"}
                          </button>
                          <button
                            type="button"
                            onClick={() => clockAction(row._id, "clock-out")}
                            disabled={!row.isClockedIn || Boolean(actionLoadingId)}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {outAction ? "Clocking Out..." : "Clock Out"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={7}>
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeClockManagement;
