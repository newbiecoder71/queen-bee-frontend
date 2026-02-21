import { useEffect, useMemo, useState, useRef } from "react";
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
  imageUrl: "",
  imageAltText: "",
  requiredItems: [],
  isPublished: true,
};

const AdminClassEditorModal = ({ open, onClose, initialValue, onSaved }) => {
  const [form, setForm] = useState(emptyForm);

  // Product search (public search endpoint)
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const classImageInputRef = useRef(null);

  // ✅ RSVP list (admin)
  const [rsvpUsers, setRsvpUsers] = useState([]);
  const [rsvpMeta, setRsvpMeta] = useState({ seatsTaken: 0, capacity: 0 });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);
  const [removingUserId, setRemovingUserId] = useState(null);

  // ✅ Admin add RSVP UI
  const [showAddRsvp, setShowAddRsvp] = useState(false);
  const [userQ, setUserQ] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);

  const userInputRef = useRef(null);
  
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
    setRemovingUserId(null);
    setShowAddRsvp(false);
    setUserQ("");
    setUserResults([]);
    setUserSearching(false);
    setAddingUserId(null);
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
        setRsvpError(
          err.response?.data?.message || err.message || "Error loading RSVPs"
        );
      } finally {
        if (!cancelled) setRsvpLoading(false);
      }
    };

    loadRsvps();

    return () => {
      cancelled = true;
    };
  }, [open, initialValue?._id]);

  // ✅ Admin remove RSVP'd customer
  const removeRsvpUser = async (userId) => {
    const classId = initialValue?._id;
    if (!classId) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Missing admin token. Please log in again.");
      return;
    }

    const confirmRemove = window.confirm(
      "Remove this customer from the class RSVP list?"
    );
    if (!confirmRemove) return;

    try {
      setRemovingUserId(userId);

      const { data } = await axios.delete(
        `${API}/api/classes/${classId}/rsvps/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update UI immediately
      setRsvpUsers((prev) => prev.filter((u) => u._id !== userId));

      // ✅ Keep meta in sync (prefer server response, else fallback)
      const newSeatsTaken =
        Number(data?.rsvpCount) ||
        Math.max(0, Number(rsvpMeta.seatsTaken ?? 0) - 1);

      setRsvpMeta((prev) => ({
        ...prev,
        seatsTaken: newSeatsTaken,
      }));
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Error removing RSVP");
    } finally {
      setRemovingUserId(null);
    }
  };

  const searchUsers = async () => {
    const classId = initialValue?._id;
    if (!classId) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      setRsvpError("Missing admin token. Please log in again.");
      return;
    }

    const term = userQ.trim();
    if (term.length < 2) {
      setUserResults([]);
      return;
    }

    setUserSearching(true);
    try {
      const { data } = await axios.get(
        `${API}/api/users/admin/search?q=${encodeURIComponent(term)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("User search error:", err);
      setUserResults([]);
      alert(err.response?.data?.message || err.message || "Error searching users");
    } finally {
      setUserSearching(false);
    }
  };

  const addRsvpUser = async (userId) => {
    const classId = initialValue?._id;
    if (!classId) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Missing admin token. Please log in again.");
      return;
    }

    try {
      setAddingUserId(userId);

      // ✅ ADMIN ADD endpoint you added in classRoutes
      const { data } = await axios.post(
        `${API}/api/classes/${classId}/rsvps/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update RSVP list + meta from server response
      setRsvpUsers(Array.isArray(data?.rsvps) ? data.rsvps : []);
      setRsvpMeta({
        seatsTaken: Number(data?.seatsTaken ?? 0),
        capacity: Number(data?.capacity ?? 0),
      });

      // Optional: clear search UI after add
      setUserQ("");
      setUserResults([]);
      setShowAddRsvp(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Error adding RSVP");
    } finally {
      setAddingUserId(null);
    }
  };

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

  const handleClassImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Missing admin token. Please log in again.");
      return;
    }

    const body = new FormData();
    body.append("image", file);

    setImageUploading(true);
    axios
      .post(`${API}/api/upload`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then(({ data }) => {
        if (!data?.imagePath) throw new Error("Image upload failed");
        setForm((prev) => ({
          ...prev,
          imageUrl: data.imagePath,
          imageAltText: prev.imageAltText || prev.title || "Class image",
        }));
      })
      .catch((err) => {
        alert(err.response?.data?.message || err.message || "Image upload failed");
      })
      .finally(() => {
        setImageUploading(false);
        if (classImageInputRef.current) classImageInputRef.current.value = "";
      });
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
    // Admin-only endpoints must include token
    const token = localStorage.getItem("userToken");

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      basePrice: Number(form.basePrice),
      images: form.imageUrl
        ? [{ url: form.imageUrl.trim(), altText: form.imageAltText?.trim() || form.title }]
        : [],
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
              <Field label="Class Image URL (optional)">
                <input
                  className="w-full rounded border p-2"
                  value={form.imageUrl || ""}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    ref={classImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleClassImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => classImageInputRef.current?.click()}
                    disabled={imageUploading}
                    className="rounded bg-gray-100 px-3 py-1 text-sm font-semibold hover:bg-gray-200"
                  >
                    {imageUploading ? "Uploading..." : "Upload Image"}
                  </button>
                </div>
              </Field>
              <Field label="Image Alt Text (optional)">
                <input
                  className="w-full rounded border p-2"
                  value={form.imageAltText || ""}
                  onChange={(e) => setForm({ ...form, imageAltText: e.target.value })}
                  placeholder="Class image description"
                />
              </Field>
            </div>

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
                <div className="relative flex-1">
                  <input
                    className="w-full rounded border p-2 pr-9"
                    placeholder="Search by name, theme, brand, category, material…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  />

                  {q && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        setResults([]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2
                                rounded text-gray-500 hover:text-black
                                focus:outline-none"
                      aria-label="Clear search"
                    >
                      {"\u2715"}
                    </button>
                  )}
                </div>

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

            {/* ✅ RSVP'd customers panel with Remove buttons */}
            <div className="rounded border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">RSVP&apos;d Customers</div>

                {initialValue?._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRsvp((v) => !v)}
                      className="rounded bg-black px-3 py-1 text-xs font-semibold text-white hover:bg-gray-900"
                    >
                      {showAddRsvp ? "Close" : "+ Add"}
                    </button>

                    <div className="text-xs text-gray-600">
                      Seats: <b>{rsvpMeta.seatsTaken}</b>
                      {rsvpMeta.capacity ? ` / ${rsvpMeta.capacity}` : ""}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">Save class to enable RSVPs</div>
                )}
              </div>

              {initialValue?._id && showAddRsvp && (
                <div className="mt-3 rounded border bg-gray-50 p-3">
                  <div className="text-sm font-semibold mb-2">
                    Add customer to RSVP
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={userInputRef}
                        className="w-full rounded border p-2 pr-9"
                        placeholder="Search by name or email…"
                        value={userQ}
                        onChange={(e) => setUserQ(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                      />

                      {userQ && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserQ("");
                            setUserResults([]);
                            userInputRef.current?.focus();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2
                                    text-gray-500 hover:text-black"
                        >
                          {"\u2715"}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={searchUsers}
                      className="rounded bg-yellow-400 px-4 font-semibold hover:bg-yellow-500"
                    >
                      {userSearching ? "..." : "Search"}
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 max-h-48 overflow-auto">
                    {userResults.map((u) => {
                      const already = rsvpUsers.some((x) => x._id === u._id);
                      return (
                        <div
                          key={u._id}
                          className="flex items-center justify-between rounded border bg-white p-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{u.name}</div>
                            <div className="text-xs text-gray-600 truncate">{u.email}</div>
                          </div>

                          <button
                            type="button"
                            disabled={already || addingUserId === u._id}
                            onClick={() => addRsvpUser(u._id)}
                            className={`rounded px-3 py-1 text-sm font-semibold ${
                              already
                                ? "bg-gray-200 text-gray-600"
                                : "bg-blue-700 text-white hover:bg-blue-800"
                            }`}
                          >
                            {already ? "Already" : addingUserId === u._id ? "Adding..." : "Add"}
                          </button>
                        </div>
                      );
                    })}

                    {!userResults.length && (
                      <div className="text-sm text-gray-600">No results yet.</div>
                    )}
                  </div>
                </div>
              )}

              {rsvpLoading && <div className="mt-2 text-sm text-gray-600">Loading…</div>}
              {rsvpError && <div className="mt-2 text-sm text-red-600">{rsvpError}</div>}

              {!rsvpLoading && !rsvpError && initialValue?._id && rsvpUsers.length === 0 && (
                <div className="mt-2 text-sm text-gray-600">No RSVPs yet.</div>
              )}

              {!rsvpLoading && rsvpUsers.length > 0 && (
                <div className="mt-3 max-h-64 overflow-auto space-y-2">
                  {rsvpUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {u.name || "Unnamed User"}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {u.email || "No email"}
                        </div>
                      </div>

                      <button
                        onClick={() => removeRsvpUser(u._id)}
                        disabled={removingUserId === u._id}
                        className={`rounded border px-2 py-1 text-sm font-semibold ${
                          removingUserId === u._id
                            ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                            : "hover:bg-red-50 text-red-600 border-red-300"
                        }`}
                        type="button"
                      >
                        {removingUserId === u._id ? "Removing..." : "Remove"}
                      </button>
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
    imageUrl: cls.images?.[0]?.url || "",
    imageAltText: cls.images?.[0]?.altText || "",
    start: toLocalInput(cls.start),
    end: toLocalInput(cls.end),
    capacity: cls.capacity ?? 10,
    basePrice: cls.basePrice ?? 0,
    requiredItems: cls.requiredItems || [],
    isPublished: cls.isPublished ?? true,
  };
};

export default AdminClassEditorModal;
