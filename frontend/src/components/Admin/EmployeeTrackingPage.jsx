import { useEffect, useMemo, useState } from "react";

const EmployeeTrackingPage = () => {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("userToken");

  const baseHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const fetchSummary = async (nextDays = days) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/time-clock/summary?days=${nextDays}`,
        { headers: baseHeaders }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load employee tracking.");
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (err) {
      setError(err.message || "Failed to load employee tracking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeDays = async (value) => {
    const next = Number(value);
    setDays(next);
    await fetchSummary(next);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Employee Tracking</h1>
        <select
          value={days}
          onChange={(e) => onChangeDays(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Shifts</th>
                <th className="px-3 py-2">Hours Worked</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={4}>
                    Loading tracking...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row._id} className="border-b">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900">{row.name}</div>
                      <div className="text-xs text-gray-600">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 capitalize">{String(row.employeeRole || "").replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">{Number(row.shifts || 0)}</td>
                    <td className="px-3 py-2 font-semibold">{Number(row.hoursWorked || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={4}>
                    No entries in this range.
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

export default EmployeeTrackingPage;

