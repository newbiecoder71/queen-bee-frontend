import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessages,
  fetchNewMessageCount,
  updateMessageStatus,
} from "../../redux/slices/messagesSlice";

const AdminMessagesPage = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.messages);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchMessages({ status, search: "" }));
  }, [dispatch, status]);

  const runSearch = () => {
    dispatch(fetchMessages({ status, search }));
  };

  const setMsgStatus = async (id, nextStatus) => {
    await dispatch(updateMessageStatus({ id, status: nextStatus }));
    // refresh count after status changes
    dispatch(fetchNewMessageCount());
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Messages</h1>

        <div className="flex items-center gap-2">
          <select
            className="rounded border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>

          <input
            className="rounded border p-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />

          <button
            onClick={runSearch}
            className="rounded bg-purple-fill px-4 py-2 text-white font-semibold hover:bg-purple-900"
            type="button"
          >
            Search
          </button>
        </div>
      </div>

      {loading && <div className="mt-6">Loading…</div>}
      {error && <div className="mt-6 text-red-600">{error}</div>}

      <div className="mt-6 space-y-4">
        {items.map((m) => (
          <div key={m._id} className="rounded border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-gray-600">{m.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="text-xs px-2 py-1 rounded border">
                {m.status}
              </div>
            </div>

            {/* TEXT ONLY */}
            <div className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-800">
              {m.message}
            </div>

            <div className="mt-4 flex gap-2">
              {m.status !== "read" && (
                <button
                  onClick={() => setMsgStatus(m._id, "read")}
                  className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
                  type="button"
                >
                  Mark Read
                </button>
              )}
              {m.status !== "archived" && (
                <button
                  onClick={() => setMsgStatus(m._id, "archived")}
                  className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
                  type="button"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="text-gray-600">No messages found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;

