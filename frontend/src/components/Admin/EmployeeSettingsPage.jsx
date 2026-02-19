import { useEffect, useState } from "react";

const EmployeeSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [employeeRoles, setEmployeeRoles] = useState([]);
  const [roleTemplates, setRoleTemplates] = useState({});

  const token = localStorage.getItem("userToken");

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/employee-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load employee settings.");
      setAvailablePermissions(data.availablePermissions || []);
      setEmployeeRoles(data.employeeRoles || []);
      setRoleTemplates(data.roleTemplates || {});
    } catch (err) {
      setError(err.message || "Failed to load employee settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePermissionForRole = (role, permission) => {
    setRoleTemplates((prev) => {
      const current = Array.isArray(prev[role]) ? prev[role] : [];
      const has = current.includes(permission);
      return {
        ...prev,
        [role]: has ? current.filter((p) => p !== permission) : [...current, permission],
      };
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/admin/employee-settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleTemplates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save employee settings.");
      setAvailablePermissions(data.availablePermissions || []);
      setEmployeeRoles(data.employeeRoles || []);
      setRoleTemplates(data.roleTemplates || {});
      setSuccess("Employee role settings updated.");
    } catch (err) {
      setError(err.message || "Failed to save employee settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Employee Permission Settings</h1>
      <p className="mb-6 text-sm text-gray-600">
        Configure what each employee role can access. These templates are used when assigning roles.
      </p>

      {loading && <p className="text-gray-600">Loading settings...</p>}
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      {!loading && employeeRoles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {employeeRoles.map((role) => (
            <div key={role} className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 capitalize">
                {String(role).replace(/_/g, " ")}
              </h2>
              <div className="space-y-2">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Array.isArray(roleTemplates[role]) && roleTemplates[role].includes(permission)}
                      onChange={() => togglePermissionForRole(role, permission)}
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={saveSettings}
          disabled={saving || loading}
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default EmployeeSettingsPage;
