import { useEffect, useMemo, useState } from "react";
import { formatPhoneNumber } from "../../utils/phone";

const MANAGER_DEFAULT_PERMISSIONS = [
  "pos.access",
  "timeclock.access",
  "products.view",
  "orders.view",
  "customer_rewards.view",
];
const PROTECTED_SUPER_ADMIN_NAME = "admin user";

const normalizePermissionKey = (permission) => {
  const value = String(permission || "").trim().toLowerCase();
  if (value === "customer_rewards.veiw") return "customer_rewards.view";
  return value;
};

const normalizePermissionList = (permissions = []) =>
  Array.from(
    new Set((permissions || []).map((p) => normalizePermissionKey(p)).filter(Boolean))
  );

const isProtectedSuperAdmin = (employee) =>
  String(employee?.role || "") === "admin" &&
  String(employee?.name || "").trim().toLowerCase() === PROTECTED_SUPER_ADMIN_NAME;

const formatHireDateForInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatAddressSingleLine = (address = {}) =>
  [address?.line1, address?.line2, address?.city, address?.state, address?.zip]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [employeeRoles, setEmployeeRoles] = useState([]);
  const [roleTemplates, setRoleTemplates] = useState({});
  const [drafts, setDrafts] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);

  const token = localStorage.getItem("userToken");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const fetchSettings = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/employee-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load employee settings.");
    const normalizedAvailable = normalizePermissionList(data.availablePermissions || []);
    const normalizedRoles = data.employeeRoles || [];
    const templates = data.roleTemplates || {};
    const normalizedTemplates = {
      cashier: normalizePermissionList(templates.cashier || []),
      senior_cashier: normalizePermissionList(templates.senior_cashier || []),
      manager: normalizePermissionList(templates.manager || []),
    };
    setAvailablePermissions(normalizedAvailable);
    setEmployeeRoles(normalizedRoles);
    setRoleTemplates(normalizedTemplates);
    return {
      availablePermissions: normalizedAvailable,
      employeeRoles: normalizedRoles,
      roleTemplates: normalizedTemplates,
    };
  };

  const fetchEmployees = async (templates = roleTemplates) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load users.");

    const employeeUsers = Array.isArray(data)
      ? data.filter((u) => u.role === "employee" || u.role === "admin")
      : [];
    setEmployees(employeeUsers);
    const initialDrafts = {};
    employeeUsers.forEach((emp) => {
      const isAdmin = emp.role === "admin";
      const roleForTemplate = emp.employeeRole || (isAdmin ? "manager" : "cashier");
      const templatePermissions = normalizePermissionList(templates?.[roleForTemplate] || []);
      const userPermissions = normalizePermissionList(emp.employeePermissions || []);
      initialDrafts[emp._id] = {
        name: emp.name || "",
        email: emp.email || "",
        phone: formatPhoneNumber(emp.phone || ""),
        hireDate: formatHireDateForInput(emp.hireDate),
        address: {
          line1: emp.address?.line1 || "",
          line2: emp.address?.line2 || "",
          city: emp.address?.city || "",
          state: emp.address?.state || "",
          zip: emp.address?.zip || "",
        },
        employeeRole: roleForTemplate,
        employeePermissions: normalizePermissionList([
          ...templatePermissions,
          ...userPermissions,
          ...(isAdmin && templatePermissions.length === 0 ? MANAGER_DEFAULT_PERMISSIONS : []),
        ]),
        employeePin: "",
        showPin: false,
      };
    });
    setDrafts(initialDrafts);
    if (employeeUsers.length > 0) {
      setSelectedEmployeeId((prev) => prev || employeeUsers[0]._id);
    } else {
      setSelectedEmployeeId("");
    }
  };

  const loadPage = async () => {
    setLoading(true);
    setError("");
    try {
      const settings = await fetchSettings();
      await fetchEmployees(settings?.roleTemplates || {});
    } catch (err) {
      setError(err.message || "Failed to load employee management.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDraft = (userId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        ...patch,
      },
    }));
  };

  const togglePermission = (userId, permission) => {
    const current = Array.isArray(drafts[userId]?.employeePermissions)
      ? drafts[userId].employeePermissions
      : [];
    const has = current.includes(permission);
    updateDraft(userId, {
      employeePermissions: has ? current.filter((p) => p !== permission) : [...current, permission],
    });
  };

  const saveEmployee = async (employee) => {
    const draft = drafts[employee._id];
    if (!draft) return false;

    setSavingId(employee._id);
    setError("");
    setSuccess("");
    try {
      const protectedSuperAdmin = isProtectedSuperAdmin(employee);
      const fallbackRole =
        draft.employeeRole || employee.employeeRole || (employee.role === "admin" ? "manager" : "cashier");
      const managerTemplate = normalizePermissionList(
        roleTemplates?.manager?.length ? roleTemplates.manager : MANAGER_DEFAULT_PERMISSIONS
      );
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users/${employee._id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(employee.role === "admin" ? {
          name: String(draft.name || employee.name || "").trim(),
          email: String(draft.email || employee.email || "").trim(),
          phone: formatPhoneNumber(String(draft.phone || "").trim()),
          hireDate: String(draft.hireDate || "").trim() || null,
          address: {
            line1: String(draft.address?.line1 || "").trim(),
            line2: String(draft.address?.line2 || "").trim(),
            city: String(draft.address?.city || "").trim(),
            state: String(draft.address?.state || "").trim(),
            zip: String(draft.address?.zip || "").trim(),
          },
          role: "admin",
          employeeRole: protectedSuperAdmin ? "manager" : fallbackRole,
          employeePermissions: protectedSuperAdmin
            ? managerTemplate
            : normalizePermissionList(draft.employeePermissions),
        } : {
          name: String(draft.name || employee.name || "").trim(),
          email: String(draft.email || employee.email || "").trim(),
          phone: formatPhoneNumber(String(draft.phone || "").trim()),
          hireDate: String(draft.hireDate || "").trim() || null,
          address: {
            line1: String(draft.address?.line1 || "").trim(),
            line2: String(draft.address?.line2 || "").trim(),
            city: String(draft.address?.city || "").trim(),
            state: String(draft.address?.state || "").trim(),
            zip: String(draft.address?.zip || "").trim(),
          },
          role: "employee",
          employeeRole: fallbackRole,
          employeePermissions: normalizePermissionList(draft.employeePermissions),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save employee.");

      setEmployees((prev) => prev.map((item) => (item._id === employee._id ? data : item)));
      setSuccess(`Saved ${String(draft.name || employee.name || "employee")}.`);
      return true;
    } catch (err) {
      setError(err.message || "Failed to save employee.");
      return false;
    } finally {
      setSavingId("");
    }
  };

  const saveEmployeePin = async (employee) => {
    const pin = String(drafts[employee._id]?.employeePin || "").trim();
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    setSavingId(`${employee._id}-pin`);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/users/${employee._id}/pin`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save employee PIN.");

      updateDraft(employee._id, { showPin: true });
      setEmployees((prev) =>
        prev.map((item) => (item._id === employee._id ? { ...item, hasPin: true } : item))
      );
      setSuccess(`Updated PIN for ${employee.name}.`);
    } catch (err) {
      setError(err.message || "Failed to save employee PIN.");
    } finally {
      setSavingId("");
    }
  };

  const applyRoleTemplate = (userId, role) => {
    const template = normalizePermissionList(roleTemplates?.[role] || []);
    updateDraft(userId, {
      employeeRole: role,
      employeePermissions: [...template],
    });
  };

  const roleLabel = (role) => String(role || "").replace(/_/g, " ");

  const groupedEmployees = useMemo(() => {
    const groups = {
      manager: [],
      senior_cashier: [],
      cashier: [],
      other: [],
    };

    employees.forEach((employee) => {
      const draftRole =
        employee.role === "admin"
          ? "manager"
          : drafts[employee._id]?.employeeRole || employee.employeeRole || "cashier";
      if (groups[draftRole]) groups[draftRole].push(employee);
      else groups.other.push(employee);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    });

    return groups;
  }, [employees, drafts]);

  const selectedEmployee = employees.find((e) => e._id === selectedEmployeeId) || null;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Employee Management</h1>
      <p className="mb-6 text-sm text-gray-600">
        Manage employee roles and permissions for POS/time clock access.
      </p>

      {loading && <p className="text-gray-600">Loading employees...</p>}
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4 rounded-lg border bg-white p-4 shadow-sm">
            {employees.length === 0 && <p className="text-gray-600">No employees found.</p>}
            {employees.length > 0 && (
              <div className="space-y-4">
                {[
                  { key: "manager", title: "Managers" },
                  { key: "senior_cashier", title: "Senior Cashiers" },
                  { key: "cashier", title: "Cashiers" },
                  { key: "other", title: "Other" },
                ].map((group) =>
                  groupedEmployees[group.key]?.length ? (
                    <div key={group.key}>
                      <h3
                        className={`mb-2 rounded px-2 py-1 text-md font-bold uppercase tracking-wide ${
                          group.key === "manager"
                            ? "bg-amber-100 text-amber-800"
                            : group.key === "senior_cashier"
                            ? "bg-sky-100 text-sky-800"
                            : group.key === "cashier"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {group.title}
                      </h3>
                      <div className="space-y-1">
                        {groupedEmployees[group.key].map((employee) => {
                          const selected = employee._id === selectedEmployeeId;
                          const currentRole =
                            drafts[employee._id]?.employeeRole ||
                            employee.employeeRole ||
                            (employee.role === "admin" ? "manager" : "cashier");
                          return (
                            <button
                              key={employee._id}
                              type="button"
                              onClick={() => setSelectedEmployeeId(employee._id)}
                              className={`w-full rounded border px-3 py-2 text-left ${
                                selected
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-semibold text-gray-900">{employee.name}</div>
                              <div className="text-xs text-gray-600">{roleLabel(currentRole)}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 rounded-lg border bg-white p-4 shadow-sm">
            {!selectedEmployee ? (
              <p className="text-gray-600">Select an employee to view and edit details.</p>
            ) : (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {drafts[selectedEmployee._id]?.name || selectedEmployee.name}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          selectedEmployee.hasPin
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {selectedEmployee.hasPin ? "PIN set" : "No PIN"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {drafts[selectedEmployee._id]?.email || selectedEmployee.email}{" "}
                      {selectedEmployee.role === "admin" ? "- Admin" : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      {String(drafts[selectedEmployee._id]?.phone || selectedEmployee.phone || "").trim() || "No phone on file"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {String(formatAddressSingleLine(drafts[selectedEmployee._id]?.address || selectedEmployee.address || {})).trim() || "No address on file"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Hire Date: {formatHireDateForInput(drafts[selectedEmployee._id]?.hireDate || selectedEmployee.hireDate) || "Not set"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    disabled={isProtectedSuperAdmin(selectedEmployee)}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isProtectedSuperAdmin(selectedEmployee) ? "Protected Super-Admin (Locked)" : "Edit Employee"}
                  </button>
                </div>

                <div className="mt-4 rounded border bg-gray-50 p-3">
                  <div className="mb-2 text-sm font-semibold text-gray-800">Employee POS PIN</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type={drafts[selectedEmployee._id]?.showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={4}
                      value={drafts[selectedEmployee._id]?.employeePin || ""}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
                        updateDraft(selectedEmployee._id, { employeePin: digitsOnly });
                      }}
                      className="w-32 rounded border px-3 py-2 text-center tracking-[0.3em]"
                      placeholder="0000"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft(selectedEmployee._id, {
                          showPin: !drafts[selectedEmployee._id]?.showPin,
                        })
                      }
                      className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {drafts[selectedEmployee._id]?.showPin ? "Hide PIN" : "Show PIN"}
                    </button>
                    <button
                      onClick={() => saveEmployeePin(selectedEmployee)}
                      disabled={savingId === `${selectedEmployee._id}-pin`}
                      className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      {savingId === `${selectedEmployee._id}-pin` ? "Saving PIN..." : "Set PIN"}
                    </button>
                    <span className="text-xs text-gray-600">
                      4 digits. PIN is encrypted in database and cannot be fetched back after refresh.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-white p-5 shadow-2xl">
            {(() => {
              const modalLocked = isProtectedSuperAdmin(selectedEmployee);
              return (
                <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Employee</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                X
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Name</label>
                <input
                  type="text"
                  value={drafts[selectedEmployee._id]?.name || ""}
                  onChange={(e) => updateDraft(selectedEmployee._id, { name: e.target.value })}
                  disabled={modalLocked}
                  className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Email</label>
                <input
                  type="email"
                  value={drafts[selectedEmployee._id]?.email || ""}
                  onChange={(e) => updateDraft(selectedEmployee._id, { email: e.target.value })}
                  disabled={modalLocked}
                  className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Phone</label>
                <input
                  type="text"
                  value={drafts[selectedEmployee._id]?.phone || ""}
                  onChange={(e) => updateDraft(selectedEmployee._id, { phone: formatPhoneNumber(e.target.value) })}
                  disabled={modalLocked}
                  className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Hire Date</label>
                <input
                  type="date"
                  value={drafts[selectedEmployee._id]?.hireDate || ""}
                  onChange={(e) => updateDraft(selectedEmployee._id, { hireDate: e.target.value })}
                  disabled={modalLocked}
                  className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="mb-4 rounded border bg-gray-50 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-800">Address</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Line 1</label>
                  <input
                    type="text"
                    value={drafts[selectedEmployee._id]?.address?.line1 || ""}
                    onChange={(e) =>
                      updateDraft(selectedEmployee._id, {
                        address: {
                          ...(drafts[selectedEmployee._id]?.address || {}),
                          line1: e.target.value,
                        },
                      })
                    }
                    disabled={modalLocked}
                    className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Line 2</label>
                  <input
                    type="text"
                    value={drafts[selectedEmployee._id]?.address?.line2 || ""}
                    onChange={(e) =>
                      updateDraft(selectedEmployee._id, {
                        address: {
                          ...(drafts[selectedEmployee._id]?.address || {}),
                          line2: e.target.value,
                        },
                      })
                    }
                    disabled={modalLocked}
                    className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    value={drafts[selectedEmployee._id]?.address?.city || ""}
                    onChange={(e) =>
                      updateDraft(selectedEmployee._id, {
                        address: {
                          ...(drafts[selectedEmployee._id]?.address || {}),
                          city: e.target.value,
                        },
                      })
                    }
                    disabled={modalLocked}
                    className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">State</label>
                  <input
                    type="text"
                    value={drafts[selectedEmployee._id]?.address?.state || ""}
                    onChange={(e) =>
                      updateDraft(selectedEmployee._id, {
                        address: {
                          ...(drafts[selectedEmployee._id]?.address || {}),
                          state: e.target.value,
                        },
                      })
                    }
                    disabled={modalLocked}
                    className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">ZIP</label>
                  <input
                    type="text"
                    value={drafts[selectedEmployee._id]?.address?.zip || ""}
                    onChange={(e) =>
                      updateDraft(selectedEmployee._id, {
                        address: {
                          ...(drafts[selectedEmployee._id]?.address || {}),
                          zip: e.target.value,
                        },
                      })
                    }
                    disabled={modalLocked}
                    className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm text-gray-700">Role</label>
              <select
                value={drafts[selectedEmployee._id]?.employeeRole || "cashier"}
                onChange={(e) => applyRoleTemplate(selectedEmployee._id, e.target.value)}
                disabled={modalLocked}
                className="rounded border px-2 py-1 text-sm disabled:bg-gray-100"
              >
                {employeeRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(drafts[selectedEmployee._id]?.employeePermissions?.includes(permission))}
                    disabled={modalLocked}
                    onChange={() => togglePermission(selectedEmployee._id, permission)}
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await saveEmployee(selectedEmployee);
                  if (ok) setShowEditModal(false);
                }}
                disabled={modalLocked || savingId === selectedEmployee._id}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {modalLocked
                  ? "Protected Super-Admin (Locked)"
                  : savingId === selectedEmployee._id
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagementPage;
