import { useEffect, useState } from "react";
import axios from "axios";
import { defaultTheme, useTheme } from "../../context/ThemeContext";

const API = import.meta.env.VITE_BACKEND_URL;

const THEME_PRESETS = [
  {
    key: "default",
    label: "Default",
    values: { ...defaultTheme, themeName: "Default" },
  },
  {
    key: "spring",
    label: "Spring",
    values: {
      ...defaultTheme,
      themeName: "Spring",
      topbarBg: "#2F855A",
      navbarBg: "#F0FFF4",
      primaryButtonBg: "#2F855A",
      primaryButtonHoverBg: "#276749",
      authCardBg: "#F0FFF4",
      authCardBorder: "#C6F6D5",
      profileIconColor: "#2F855A",
      profileSaveButtonBg: "#166534",
      profileSaveButtonHoverBg: "#14532D",
      profileLogoutButtonBg: "#166534",
      profileLogoutButtonHoverBg: "#14532D",
      addToCartButtonBg: "#2F855A",
      addToCartButtonHoverBg: "#276749",
      shopNowButtonBg: "#2F855A",
      shopNowButtonHoverBg: "#276749",
    },
  },
  {
    key: "summer",
    label: "Summer",
    values: {
      ...defaultTheme,
      themeName: "Summer",
      topbarBg: "#B45309",
      navbarBg: "#FFFBEB",
      primaryButtonBg: "#D97706",
      primaryButtonHoverBg: "#B45309",
      authCardBg: "#FFFBEB",
      authCardBorder: "#FDE68A",
      profileIconColor: "#B45309",
      profileSaveButtonBg: "#92400E",
      profileSaveButtonHoverBg: "#78350F",
      profileLogoutButtonBg: "#92400E",
      profileLogoutButtonHoverBg: "#78350F",
      addToCartButtonBg: "#D97706",
      addToCartButtonHoverBg: "#B45309",
      shopNowButtonBg: "#D97706",
      shopNowButtonHoverBg: "#B45309",
    },
  },
  {
    key: "fall",
    label: "Fall",
    values: {
      ...defaultTheme,
      themeName: "Fall",
      topbarBg: "#7C2D12",
      navbarBg: "#FFF7ED",
      primaryButtonBg: "#9A3412",
      primaryButtonHoverBg: "#7C2D12",
      authCardBg: "#FFF7ED",
      authCardBorder: "#FED7AA",
      profileIconColor: "#9A3412",
      profileSaveButtonBg: "#7C2D12",
      profileSaveButtonHoverBg: "#6B210F",
      profileLogoutButtonBg: "#7C2D12",
      profileLogoutButtonHoverBg: "#6B210F",
      addToCartButtonBg: "#9A3412",
      addToCartButtonHoverBg: "#7C2D12",
      shopNowButtonBg: "#9A3412",
      shopNowButtonHoverBg: "#7C2D12",
    },
  },
  {
    key: "winter",
    label: "Winter",
    values: {
      ...defaultTheme,
      themeName: "Winter",
      topbarBg: "#1E3A8A",
      navbarBg: "#EFF6FF",
      primaryButtonBg: "#1D4ED8",
      primaryButtonHoverBg: "#1E40AF",
      authCardBg: "#EFF6FF",
      authCardBorder: "#BFDBFE",
      profileIconColor: "#1E3A8A",
      profileSaveButtonBg: "#1E40AF",
      profileSaveButtonHoverBg: "#1E3A8A",
      profileLogoutButtonBg: "#1E40AF",
      profileLogoutButtonHoverBg: "#1E3A8A",
      addToCartButtonBg: "#1D4ED8",
      addToCartButtonHoverBg: "#1E40AF",
      shopNowButtonBg: "#1D4ED8",
      shopNowButtonHoverBg: "#1E40AF",
    },
  },
  {
    key: "christmas",
    label: "Christmas",
    values: {
      ...defaultTheme,
      themeName: "Christmas",
      topbarBg: "#991B1B",
      navbarBg: "#F0FDF4",
      primaryButtonBg: "#166534",
      primaryButtonHoverBg: "#14532D",
      authCardBg: "#FEF2F2",
      authCardBorder: "#FECACA",
      profileIconColor: "#166534",
      profileSaveButtonBg: "#166534",
      profileSaveButtonHoverBg: "#14532D",
      profileLogoutButtonBg: "#166534",
      profileLogoutButtonHoverBg: "#14532D",
      addToCartButtonBg: "#166534",
      addToCartButtonHoverBg: "#14532D",
      shopNowButtonBg: "#166534",
      shopNowButtonHoverBg: "#14532D",
    },
  },
  {
    key: "halloween",
    label: "Halloween",
    values: {
      ...defaultTheme,
      themeName: "Halloween",
      topbarBg: "#111827",
      navbarBg: "#FFF7ED",
      primaryButtonBg: "#EA580C",
      primaryButtonHoverBg: "#C2410C",
      authCardBg: "#FFEDD5",
      authCardBorder: "#FDBA74",
      profileIconColor: "#EA580C",
      profileSaveButtonBg: "#EA580C",
      profileSaveButtonHoverBg: "#C2410C",
      profileLogoutButtonBg: "#EA580C",
      profileLogoutButtonHoverBg: "#C2410C",
      addToCartButtonBg: "#EA580C",
      addToCartButtonHoverBg: "#C2410C",
      shopNowButtonBg: "#EA580C",
      shopNowButtonHoverBg: "#C2410C",
    },
  },
  {
    key: "valentines",
    label: "Valentine's",
    values: {
      ...defaultTheme,
      themeName: "Valentine's",
      topbarBg: "#BE185D",
      navbarBg: "#FDF2F8",
      primaryButtonBg: "#DB2777",
      primaryButtonHoverBg: "#BE185D",
      authCardBg: "#FDF2F8",
      authCardBorder: "#FBCFE8",
      profileIconColor: "#DB2777",
      profileSaveButtonBg: "#DB2777",
      profileSaveButtonHoverBg: "#BE185D",
      profileLogoutButtonBg: "#DB2777",
      profileLogoutButtonHoverBg: "#BE185D",
      addToCartButtonBg: "#DB2777",
      addToCartButtonHoverBg: "#BE185D",
      shopNowButtonBg: "#DB2777",
      shopNowButtonHoverBg: "#BE185D",
    },
  },
];

const AdminThemePage = () => {
  const { theme, setTheme, refreshTheme } = useTheme();
  const [form, setForm] = useState({ ...theme });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ ...theme });
  }, [theme]);

  const token = localStorage.getItem("userToken");

  const setField = (key, value) => {
    const next = { ...form, [key]: value };
    if (key === "profileSaveButtonBg") {
      next.profileLogoutButtonBg = value;
    }
    if (key === "profileSaveButtonHoverBg") {
      next.profileLogoutButtonHoverBg = value;
    }
    setForm(next);
    setTheme(next); // live preview
  };

  const saveTheme = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        ...form,
        profileLogoutButtonBg: form.profileSaveButtonBg,
        profileLogoutButtonHoverBg: form.profileSaveButtonHoverBg,
      };
      const { data } = await axios.put(`${API}/api/theme`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTheme(data || form);
      setMessage("Theme saved.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to save theme.");
    } finally {
      setSaving(false);
    }
  };

  const reloadTheme = async () => {
    try {
      setError("");
      setMessage("");
      await refreshTheme();
      setMessage("Theme reloaded.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to reload theme.");
    }
  };

  const resetTheme = () => {
    setForm({ ...defaultTheme });
    setTheme({ ...defaultTheme });
    setMessage("Reset to defaults. Click Save to publish.");
    setError("");
  };

  const applyPreset = (presetValues) => {
    const next = {
      ...presetValues,
      addToCartButtonBg:
        presetValues.addToCartButtonBg || presetValues.primaryButtonBg || form.primaryButtonBg,
      addToCartButtonHoverBg:
        presetValues.addToCartButtonHoverBg ||
        presetValues.primaryButtonHoverBg ||
        form.primaryButtonHoverBg,
      shopNowButtonBg:
        presetValues.shopNowButtonBg || presetValues.primaryButtonBg || form.primaryButtonBg,
      shopNowButtonHoverBg:
        presetValues.shopNowButtonHoverBg ||
        presetValues.primaryButtonHoverBg ||
        form.primaryButtonHoverBg,
    };
    setForm(next);
    setTheme(next);
    setMessage(`Preset "${next.themeName || "Theme"}" applied. Click Save to publish.`);
    setError("");
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Theme</h1>
        <div className="text-sm text-gray-600">Seasonal/Holiday color control</div>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="mb-4 rounded border bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold">Quick Presets</div>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.values)}
              className="rounded border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded border bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 font-semibold">Theme Name</div>
          <input
            value={form.themeName || ""}
            onChange={(e) => setField("themeName", e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Spring 2026"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Hero Image URL</div>
          <input
            value={form.heroImageUrl || ""}
            onChange={(e) => setField("heroImageUrl", e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="/images/IMG_2357-opt.jpg or https://..."
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Topbar Color</div>
          <input
            type="color"
            value={form.topbarBg || defaultTheme.topbarBg}
            onChange={(e) => setField("topbarBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Navbar Color</div>
          <input
            type="color"
            value={form.navbarBg || defaultTheme.navbarBg}
            onChange={(e) => setField("navbarBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Primary Button</div>
          <input
            type="color"
            value={form.primaryButtonBg || defaultTheme.primaryButtonBg}
            onChange={(e) => setField("primaryButtonBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Primary Hover</div>
          <input
            type="color"
            value={form.primaryButtonHoverBg || defaultTheme.primaryButtonHoverBg}
            onChange={(e) => setField("primaryButtonHoverBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Add To Cart Button</div>
          <input
            type="color"
            value={form.addToCartButtonBg || defaultTheme.addToCartButtonBg}
            onChange={(e) => setField("addToCartButtonBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Add To Cart Hover</div>
          <input
            type="color"
            value={form.addToCartButtonHoverBg || defaultTheme.addToCartButtonHoverBg}
            onChange={(e) => setField("addToCartButtonHoverBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Shop Now Button</div>
          <input
            type="color"
            value={form.shopNowButtonBg || defaultTheme.shopNowButtonBg}
            onChange={(e) => setField("shopNowButtonBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Shop Now Hover</div>
          <input
            type="color"
            value={form.shopNowButtonHoverBg || defaultTheme.shopNowButtonHoverBg}
            onChange={(e) => setField("shopNowButtonHoverBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Login/Register Card Background</div>
          <input
            type="color"
            value={form.authCardBg || defaultTheme.authCardBg}
            onChange={(e) => setField("authCardBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 font-semibold">Login/Register Card Border</div>
          <input
            type="color"
            value={form.authCardBorder || defaultTheme.authCardBorder}
            onChange={(e) => setField("authCardBorder", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <div className="mb-1 font-semibold">Profile Icon Color</div>
          <input
            type="color"
            value={form.profileIconColor || defaultTheme.profileIconColor}
            onChange={(e) => setField("profileIconColor", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 font-semibold">Save Profile Button</div>
          <input
            type="color"
            value={form.profileSaveButtonBg || defaultTheme.profileSaveButtonBg}
            onChange={(e) => setField("profileSaveButtonBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 font-semibold">Save Profile Hover</div>
          <input
            type="color"
            value={form.profileSaveButtonHoverBg || defaultTheme.profileSaveButtonHoverBg}
            onChange={(e) => setField("profileSaveButtonHoverBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 font-semibold">Logout Button</div>
          <input
            type="color"
            value={form.profileLogoutButtonBg || defaultTheme.profileLogoutButtonBg}
            onChange={(e) => setField("profileLogoutButtonBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 font-semibold">Logout Hover</div>
          <input
            type="color"
            value={form.profileLogoutButtonHoverBg || defaultTheme.profileLogoutButtonHoverBg}
            onChange={(e) => setField("profileLogoutButtonHoverBg", e.target.value)}
            className="h-10 w-full rounded border px-1"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveTheme}
          disabled={saving}
          className="rounded px-4 py-2 text-sm font-semibold theme-primary-btn disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Theme"}
        </button>
        <button
          type="button"
          onClick={reloadTheme}
          className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={resetTheme}
          className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Reset Defaults
        </button>
      </div>
    </div>
  );
};

export default AdminThemePage;
