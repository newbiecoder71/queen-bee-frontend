import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  _id: "",
  name: "",
  customerContactEmail: "",
  phone: "",
  birthdayMonth: "",
  birthdayDay: "",
  address: { line1: "", line2: "", city: "", state: "", zip: "" },
  adminNotes: "",
  newsletterSubscribed: false,
  taxExempt: false,
  taxExemptId: "",
  employeeDiscountEnabled: false,
  employeeDiscountPercent: "",
  password: "",
  confirmPassword: "",
};

const CustomerManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem("userToken");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const sortCustomersForDisplay = (list = []) =>
    [...list].sort((a, b) => {
      const aTaxExempt = Boolean(a?.taxExempt);
      const bTaxExempt = Boolean(b?.taxExempt);
      if (aTaxExempt !== bTaxExempt) return aTaxExempt ? 1 : -1;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });

  const loadCustomers = async (term = "") => {
    setLoading(true);
    setError("");
    try {
      const q = String(term || "").trim();
      const url = q
        ? `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/customers?search=${encodeURIComponent(q)}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/customers`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load customers.");
      setCustomers(sortCustomersForDisplay(Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || "Failed to load customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (customer) => {
    setForm({
      _id: customer._id,
      name: customer.name || "",
      customerContactEmail: customer.customerContactEmail || "",
      phone: customer.phone || "",
      birthdayMonth: customer.birthdayMonth ? String(customer.birthdayMonth) : "",
      birthdayDay: customer.birthdayDay ? String(customer.birthdayDay) : "",
      address: {
        line1: customer.address?.line1 || "",
        line2: customer.address?.line2 || "",
        city: customer.address?.city || "",
        state: customer.address?.state || "",
        zip: customer.address?.zip || "",
      },
      adminNotes: customer.adminNotes || "",
      newsletterSubscribed: Boolean(customer.newsletterSubscribed),
      taxExempt: Boolean(customer.taxExempt),
      taxExemptId: customer.taxExemptId || "",
      employeeDiscountEnabled: Boolean(customer.employeeDiscountEnabled),
      employeeDiscountPercent: customer.employeeDiscountEnabled
        ? String(Number(customer.employeeDiscountPercent || 0))
        : "",
      password: "",
      confirmPassword: "",
    });
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const saveCustomer = async () => {
    if (!String(form.name || "").trim()) {
      setError("Name is required.");
      return;
    }
    if (!String(form.phone || "").trim()) {
      setError("Phone is required.");
      return;
    }
    if (String(form.password || "").trim() || String(form.confirmPassword || "").trim()) {
      if (String(form.password || "") !== String(form.confirmPassword || "")) {
        setError("Password and confirm password do not match.");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
      if (!passwordRegex.test(String(form.password || ""))) {
        setError(
          "Password must be at least 6 characters and include uppercase, lowercase, and a number."
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: String(form.name || "").trim(),
        customerContactEmail: String(form.customerContactEmail || "").trim(),
        phone: String(form.phone || "").trim(),
        birthdayMonth: form.birthdayMonth ? Number(form.birthdayMonth) : null,
        birthdayDay: form.birthdayDay ? Number(form.birthdayDay) : null,
        address: {
          line1: form.address.line1 || "",
          line2: form.address.line2 || "",
          city: form.address.city || "",
          state: form.address.state || "",
          zip: form.address.zip || "",
        },
        adminNotes: form.adminNotes || "",
        newsletterSubscribed: Boolean(form.newsletterSubscribed),
        taxExempt: Boolean(form.taxExempt),
        taxExemptId: form.taxExempt ? String(form.taxExemptId || "").trim() : "",
        employeeDiscountEnabled: Boolean(form.employeeDiscountEnabled),
        employeeDiscountPercent: form.employeeDiscountEnabled
          ? Number(form.employeeDiscountPercent || 0)
          : 0,
      };
      if (String(form.password || "").trim()) {
        payload.password = String(form.password).trim();
      }

      const isEdit = Boolean(form._id);
      const url = isEdit
        ? `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/customers/${form._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/customers`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save customer.");

      setSuccess(isEdit ? "Customer updated." : "Customer created.");
      setShowModal(false);
      await loadCustomers(search);
    } catch (err) {
      setError(err.message || "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                loadCustomers(search);
              }}
              className="rounded border px-3 py-2 pr-9 text-sm"
              placeholder="Search customers..."
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  loadCustomers("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                aria-label="Clear customer search"
              >
                {"\u2715"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => loadCustomers(search)}
            className="rounded theme-primary-btn px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Search
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add Customer
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Birthday</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={5}>
                  Loading customers...
                </td>
              </tr>
            ) : customers.length ? (
              customers.map((customer) => (
                <tr
                  key={customer._id}
                  className="cursor-pointer border-b hover:bg-gray-50"
                  onClick={() => openEdit(customer)}
                >
                  <td className="px-3 py-2">
                    <div className="font-semibold text-gray-900">{customer.name || "-"}</div>
                    {Boolean(customer.taxExempt) && (
                      <div className="mt-0.5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Tax Exempt (No Rewards)
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {[
                      customer.address?.line1,
                      customer.address?.line2,
                      customer.address?.city,
                      customer.address?.state,
                      customer.address?.zip,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-3 py-2">{customer.phone || "-"}</td>
                  <td className="px-3 py-2">{customer.customerContactEmail || customer.email || "-"}</td>
                  <td className="px-3 py-2">
                    {customer.birthdayMonth && customer.birthdayDay
                      ? `${customer.birthdayMonth}/${customer.birthdayDay}`
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={5}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-white p-5 shadow-2xl">
            <h3 className="mb-3 text-lg font-bold">{form._id ? "Edit Customer" : "Add Customer"}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded border p-2"
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                className="rounded border p-2"
                placeholder="Phone *"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <input
                className="rounded border p-2"
                placeholder="Email (optional)"
                value={form.customerContactEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, customerContactEmail: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded border p-2"
                  placeholder="Birth Month"
                  value={form.birthdayMonth}
                  onChange={(e) => setForm((prev) => ({ ...prev, birthdayMonth: e.target.value }))}
                />
                <input
                  className="rounded border p-2"
                  placeholder="Birth Day"
                  value={form.birthdayDay}
                  onChange={(e) => setForm((prev) => ({ ...prev, birthdayDay: e.target.value }))}
                />
              </div>
              <input
                className="rounded border p-2 md:col-span-2"
                placeholder="Address line 1"
                value={form.address.line1}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))
                }
              />
              <input
                className="rounded border p-2 md:col-span-2"
                placeholder="Address line 2"
                value={form.address.line2}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))
                }
              />
              <input
                className="rounded border p-2"
                placeholder="City"
                value={form.address.city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }))
                }
              />
              <input
                className="rounded border p-2"
                placeholder="State"
                value={form.address.state}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: { ...prev.address, state: e.target.value } }))
                }
              />
              <input
                className="rounded border p-2 md:col-span-2"
                placeholder="Zip"
                value={form.address.zip}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: { ...prev.address, zip: e.target.value } }))
                }
              />
              <textarea
                className="rounded border p-2 md:col-span-2"
                rows={3}
                placeholder="Notes"
                value={form.adminNotes}
                onChange={(e) => setForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.newsletterSubscribed)}
                  onChange={(e) => setForm((prev) => ({ ...prev, newsletterSubscribed: e.target.checked }))}
                />
                Newsletter Signed Up
              </label>
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.taxExempt)}
                    onChange={(e) => setForm((prev) => ({ ...prev, taxExempt: e.target.checked }))}
                  />
                  Tax Exempt
                </label>
                <input
                  className={`rounded border p-1 text-sm ${form.taxExempt ? "" : "bg-gray-100 text-gray-400"}`}
                  placeholder="Tax ID"
                  disabled={!form.taxExempt}
                  value={form.taxExemptId}
                  onChange={(e) => setForm((prev) => ({ ...prev, taxExemptId: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 text-sm md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.employeeDiscountEnabled)}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, employeeDiscountEnabled: e.target.checked }))
                    }
                  />
                  Employee Discount
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-28 rounded border p-1 text-sm ${
                    form.employeeDiscountEnabled ? "" : "bg-gray-100 text-gray-400"
                  }`}
                  disabled={!form.employeeDiscountEnabled}
                  placeholder="%"
                  value={form.employeeDiscountPercent}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, employeeDiscountPercent: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2 mt-1 rounded border bg-gray-50 p-2">
                <div className="mb-2 text-xs font-semibold text-gray-700">
                  Reset Login Password (optional)
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    type="password"
                    className="rounded border p-2"
                    placeholder="New password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <input
                    type="password"
                    className="rounded border p-2"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                  />
                </div>
                <div className="mt-1 text-[11px] text-gray-600">
                  Rule: at least 6 characters with uppercase, lowercase, and a number.
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomer}
                disabled={saving}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;


