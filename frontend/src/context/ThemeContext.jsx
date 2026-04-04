import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;
const THEME_STORAGE_KEY = "qbThemeSettings";

export const defaultTheme = {
  themeName: "Default",
  topbarBg: "#6B21A8",
  navbarBg: "#F3E8FF",
  primaryButtonBg: "#6B21A8",
  primaryButtonHoverBg: "#581C87",
  authCardBg: "#FAF5FF",
  authCardBorder: "#F3E8FF",
  profileIconColor: "#6B21A8",
  profileSaveButtonBg: "#111827",
  profileSaveButtonHoverBg: "#1F2937",
  profileLogoutButtonBg: "#111827",
  profileLogoutButtonHoverBg: "#1F2937",
  addToCartButtonBg: "#6B21A8",
  addToCartButtonHoverBg: "#581C87",
  shopNowButtonBg: "#6B21A8",
  shopNowButtonHoverBg: "#581C87",
  heroImageUrl: "/images/IMG_2357-opt.jpg",
};

const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {},
  refreshTheme: async () => {},
});

const mergeTheme = (incoming = {}) => ({ ...defaultTheme, ...(incoming || {}) });

const applyThemeToDocument = (theme) => {
  const doc = document.documentElement;
  doc.style.setProperty("--theme-topbar-bg", theme.topbarBg || defaultTheme.topbarBg);
  doc.style.setProperty("--theme-navbar-bg", theme.navbarBg || defaultTheme.navbarBg);
  doc.style.setProperty("--theme-primary-btn-bg", theme.primaryButtonBg || defaultTheme.primaryButtonBg);
  doc.style.setProperty(
    "--theme-hero-heading-color",
    theme.primaryButtonBg || defaultTheme.primaryButtonBg
  );
  doc.style.setProperty(
    "--theme-primary-btn-hover-bg",
    theme.primaryButtonHoverBg || defaultTheme.primaryButtonHoverBg
  );
  doc.style.setProperty("--theme-auth-card-bg", theme.authCardBg || defaultTheme.authCardBg);
  doc.style.setProperty("--theme-auth-card-border", theme.authCardBorder || defaultTheme.authCardBorder);
  doc.style.setProperty(
    "--theme-profile-icon-color",
    theme.profileIconColor || defaultTheme.profileIconColor
  );
  doc.style.setProperty(
    "--theme-profile-save-btn-bg",
    theme.profileSaveButtonBg || defaultTheme.profileSaveButtonBg
  );
  doc.style.setProperty(
    "--theme-profile-save-btn-hover-bg",
    theme.profileSaveButtonHoverBg || defaultTheme.profileSaveButtonHoverBg
  );
  doc.style.setProperty(
    "--theme-profile-logout-btn-bg",
    theme.profileLogoutButtonBg || defaultTheme.profileLogoutButtonBg
  );
  doc.style.setProperty(
    "--theme-profile-logout-btn-hover-bg",
    theme.profileLogoutButtonHoverBg || defaultTheme.profileLogoutButtonHoverBg
  );
  doc.style.setProperty(
    "--theme-add-to-cart-btn-bg",
    theme.addToCartButtonBg || defaultTheme.addToCartButtonBg
  );
  doc.style.setProperty(
    "--theme-add-to-cart-btn-hover-bg",
    theme.addToCartButtonHoverBg || defaultTheme.addToCartButtonHoverBg
  );
  doc.style.setProperty(
    "--theme-shop-now-btn-bg",
    theme.shopNowButtonBg || defaultTheme.shopNowButtonBg
  );
  doc.style.setProperty(
    "--theme-shop-now-btn-hover-bg",
    theme.shopNowButtonHoverBg || defaultTheme.shopNowButtonHoverBg
  );
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (!raw) return defaultTheme;
      return mergeTheme(JSON.parse(raw));
    } catch {
      return defaultTheme;
    }
  });

  const setTheme = (nextTheme) => {
    const merged = mergeTheme(nextTheme);
    setThemeState(merged);
    applyThemeToDocument(merged);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(merged));
  };

  const refreshTheme = async () => {
    const { data } = await axios.get(`${API}/api/theme`);
    setTheme(data || defaultTheme);
  };

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    refreshTheme().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ theme, setTheme, refreshTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
