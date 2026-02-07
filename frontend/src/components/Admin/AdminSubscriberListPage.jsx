import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { fetchNewSubscriberCount } from "../../redux/slices/newsletterSlice";

const API = import.meta.env.VITE_BACKEND_URL;

const AdminSubscriberListPage = () => {
  const dispatch = useDispatch();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(""); // "" = all
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(
        `${API}/api/newsletter/subscribers?status=${encodeURIComponent(
          status
        )}&search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const markSeen = async (id) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(
        `${API}/api/newsletter/${id}/state`,
        { state: "seen" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ refresh table + refresh sidebar badge immediately
      await load();
      dispatch(fetchNewSubscriberCount());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    load();
    // Keep badge count fresh when visiting this page
    dispatch(fetchNewSubscriberCount());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Newsletter Subscriber List</h1>

        <div className="flex items-center gap-2">
          <select
            className="rounded border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <input
            className="rounded border p-2"
            placeholder="Search email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />

          <button
            onClick={load}
            className="rounded bg-black px-4 py-2 text-white font-semibold hover:bg-gray-900"
            type="button"
          >
            Search
          </button>
        </div>
      </div>

      {loading && <div className="mt-6">Loading…</div>}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.length > 0 ? (
              items.map((s) => (
                <tr key={s._id} className="border-b">
                  <td className="p-4 whitespace-pre-wrap break-words">{s.email}</td>
                  <td className="p-4">{s.status}</td>
                  <td className="p-4">{s.state}</td>
                  <td className="p-4">
                    {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-4">
                    {s.state === "new" ? (
                      <button
                        onClick={() => markSeen(s._id)}
                        className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
                        type="button"
                      >
                        Mark Seen
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No subscribers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscriberListPage;
