import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const emptyForm = {
  title: "",
  description: "",
  instructor: "",
  start: "",
  end: "",
  capacity: 10,
  basePrice: 0,
  requiredItems: [],
  isPublished: true,
};

const AdminClassEditorModal = ({ open, onClose, initialValue, onSaved }) => {
  const [form, setForm] = useState(emptyForm);

  // Product search (public search endpoint)
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ✅ RSVP list (admin)
  const [rsvpUsers, setRsvpUsers] = useState([]);
  const [rsvpMeta, setRsvpMeta] = useState({ seatsTaken: 0, capacity: 0 });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setForm(initialValue ? toForm(initialValue) : emptyForm);
    setQ("");
    setResults([]);
    setSearching(false);

    // reset RSVP UI
    setRsvpUsers([]);
    setRsvpMeta({ seatsTaken: 0, capacity: 0 });
    setRsvpLoading(false);
    setRsvpError(null);
  }, [open, initialValue]);

  // ✅ Load RSVP'd customers when editing an existing class
  useEffect(() => {
    const classId = initialValue?._id;
    if (!open || !classId) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      setRsvpError("Missing admin token. Please log in again.");
      return;
    }

    let cancelled = false;

    const loadRsvps = async () => {
      try {
        setRsvpLoading(true);
        setRsvpError(null);

        const { data } = await axios.get(`${API}/api/classes/${classId}/rsvps`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        setRsvpUsers(Array.isArray(data?.rsvps) ? data.rsvps : []);
        setRsvpMeta({
          seatsTaken: Number(data?.seatsTaken ?? 0),
          capacity: Number(data?.capacity ?? 0),
        });
      } catch (err) {
        if (cancelled) return;
        setRsvpUsers([]);
        setRsvpMeta({ seatsTaken: 0, capacity: 0 });
        setRsvpError(err.response?.data?.message || err.message || "Error loading RSVPs");
      } finally {
        if (!cancelled) setRsvpLoading(false);
      }
    };

    loadRsvps();

    return () => {
      cancelled = true;
    };
  }, [open, initialValue?._id]);

  const itemsTotal = useMemo(() => {
    return (form.requiredItems || []).reduce(
      (sum, it) => sum + Number(it.unitPrice) * Number(it.quantity),
      0
    );
  }, [form.requiredItems]);

  const totalPrice = useMemo(() => {
    return Number(form.basePrice) + itemsTotal;
  }, [form.basePrice, itemsTotal]);

  const runSearch = async () => {
    const term = q.trim();
    if (!term) return;

    setSearching(true);
    try {
      const { data } = await axios.get(
        `${API}/api/products?search=${encodeURIComponent(term)}&limit=20`
      );
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Product search error:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addItem = (p) => {
    if (!p?._id) return;
    if (form.requiredItems.some((it) => it.product === p._id)) return;

    setForm((prev) => ({
      ...prev,
      requiredItems: [
        ...prev.requiredItems,
        {
          product: p._id,
          title: p.name,
          sku: p.sku || "",
          unitPrice: Number(p.price || 0),
          quantity: 1,
        },
      ],
    }));
  };

  const updateItemQty = (productId, qty) => {
    setForm((prev) => ({
      ...prev,
      requiredItems: prev.requiredItems.map((it) =>
        it.product === productId
          ? { ...it, quantity: Math.max(1, Number(qty || 1)) }
          : it
      ),
    }));
  };

  const removeItem = (productId) => {
    setForm((prev) => ({
      ...prev,
      requiredItems: prev.requiredItems.filter((it) => it.product !== productId),
    }));
  };

  const save = async () => {
    const token = localStorage.getItem("userToken");

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      basePrice: Number(form.basePrice),
    };

    try {
      if (initialValue?._id) {
        await axios.put(`${API}/api/classes/${initialValue._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/api/classes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onSaved?.();
    } catch (err) {
      console.error("Save class error:", err);
      alert(err.response?.data?.message || err.message || "Error saving class");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">
          {initialValue ? "Edit Class" : "Create New Class"}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={save}
            className="rounded bg-black px-4 py-1 text-sm font-semibold text-white hover:bg-gray-900"
            type="button"
          >
            Save
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="h-[calc(100vh-56px)] overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: class details */}
          <div className="space-y-3">
            <Field label="Title">
              <input
                className="w-full rounded border p-2"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>

            <Field label="Description">
              <textarea
                className="w-full rounded border p-2 h-28"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>

            <Field label="Instructor (optional)">
              <input
                className="w-full rounded border p-2"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Start">
                <input
                  type="datetime-local"
                  className="w-full rounded border p-2"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </Field>

              <Field label="End">
                <input
                  type="datetime-local"
                  className="w-full rounded border p-2"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Capacity">
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </Field>

              <Field label="Base Price">
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                />
              </Field>

              <Field label="Published">
                <select
                  className="w-full rounded border p-2"
                  value={String(form.isPublished)}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.value === "true" })
                  }
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
            </div>

            <div className="rounded border p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">Items Total</div>
                <div className="font-semibold">${itemsTotal.toFixed(2)}</div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="text-sm text-gray-700">Total Class Price</div>
                <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Right: product search + required items + RSVP list */}
          <div className="space-y-4">
            <div className="rounded border p-3">
              <div className="font-semibold mb-2">Search Products (supplies)</div>

              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border p-2"
                  placeholder="Search by name, theme, brand, category, material…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                />

                <button
                  onClick={runSearch}
                  className="rounded bg-yellow-400 px-4 font-semibold hover:bg-yellow-500"
                  type="button"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-56 overflow-auto">
                {results.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-600">
                        ${Number(p.price || 0).toFixed(2)}
                        {typeof p.countInStock !== "undefined"
                          ? ` • Stock: ${p.countInStock}`
                          : ""}
                      </div>
                    </div>

                    <button
                      onClick={() => addItem(p)}
                      className="rounded bg-black px-3 py-1 text-sm font-semibold text-white hover:bg-gray-900"
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                ))}

                {!results.length && (
                  <div className="text-sm text-gray-500 mt-2">No results yet.</div>
                )}
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="font-semibold mb-2">Required Items</div>

              <div className="space-y-2">
                {form.requiredItems.map((it) => (
                  <div
                    key={it.product}
                    className="flex items-center justify-between gap-3 rounded border p-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{it.title}</div>
                      <div className="text-xs text-gray-600">
                        ${Number(it.unitPrice).toFixed(2)} each
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="w-20 rounded border p-1"
                        value={it.quantity}
                        onChange={(e) => updateItemQty(it.product, e.target.value)}
                      />

                      <button
                        onClick={() => removeItem(it.product)}
                        className="rounded border px-2 py-1 text-sm font-semibold hover:bg-gray-50"
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {!form.requiredItems.length && (
                  <div className="text-sm text-gray-500">No required items yet.</div>
                )}
              </div>
            </div>

            {/* ✅ RSVP'd customers panel */}
            <div className="rounded border p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">RSVP&apos;d Customers</div>
                {initialValue?._id ? (
                  <div className="text-xs text-gray-600">
                    Seats: <b>{rsvpMeta.seatsTaken}</b>
                    {rsvpMeta.capacity ? ` / ${rsvpMeta.capacity}` : ""}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">Save class to enable RSVPs</div>
                )}
              </div>

              {rsvpLoading && <div className="mt-2 text-sm text-gray-600">Loading…</div>}
              {rsvpError && <div className="mt-2 text-sm text-red-600">{rsvpError}</div>}

              {!rsvpLoading && !rsvpError && initialValue?._id && rsvpUsers.length === 0 && (
                <div className="mt-2 text-sm text-gray-600">No RSVPs yet.</div>
              )}

              {!rsvpLoading && rsvpUsers.length > 0 && (
                <div className="mt-3 max-h-64 overflow-auto space-y-2">
                  {rsvpUsers.map((u) => (
                    <div key={u._id} className="rounded border bg-white px-3 py-2">
                      <div className="text-sm font-semibold">{u.name || "Unnamed User"}</div>
                      <div className="text-xs text-gray-600">{u.email || "No email"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Admin-only create/edit is enforced on the server via <code>protect</code> +{" "}
          <code>admin</code>.
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
};

const toForm = (cls) => {
  const toLocalInput = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return {
    title: cls.title || "",
    description: cls.description || "",
    instructor: cls.instructor || "",
    start: toLocalInput(cls.start),
    end: toLocalInput(cls.end),
    capacity: cls.capacity ?? 10,
    basePrice: cls.basePrice ?? 0,
    requiredItems: cls.requiredItems || [],
    isPublished: cls.isPublished ?? true,
  };
};

export default AdminClassEditorModal;
