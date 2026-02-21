import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import CartDrawer from "../Layout/CartDrawer";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  // desktop dropdown
  const [shopOpen, setShopOpen] = useState(false);

  // mobile collapsible section
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchMounted, setMobileSearchMounted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ inline navbar search
  const [navSearch, setNavSearch] = useState("");
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [navSearching, setNavSearching] = useState(false);
  const [showNavSuggestions, setShowNavSuggestions] = useState(false);
  const [navProductCache, setNavProductCache] = useState([]);
  const navSearchRef = useRef(null);
  const navSearchWrapRef = useRef(null);

  const runNavSearch = ({ closeMobile = true } = {}) => {
    const term = String(navSearch || "").trim();
    if (!term) return;

    // Send to your collections page using your existing query param
    navigate(`/collections/all?search=${encodeURIComponent(term)}`);
    setShowNavSuggestions(false);
    if (closeMobile) setMobileSearchOpen(false);

    // Optional: clear after searching
    // setNavSearch("");
  };

  const clearNavSearch = () => {
    setNavSearch("");
    setShowNavSuggestions(false);
    const params = new URLSearchParams(location.search);
    if (params.get("search")) {
      navigate("/collections/all");
    }
  };

  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (mobileSearchOpen) {
      setMobileSearchMounted(true);
    } else {
      // wait for the closing animation to finish before unmounting
      const t = setTimeout(() => setMobileSearchMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    let mounted = true;
    const loadNavCache = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products`, {
          params: { limit: 5000 },
        });
        if (!mounted) return;
        setNavProductCache(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setNavProductCache([]);
      }
    };
    loadNavCache();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const term = String(navSearch || "").trim();
    if (term.length < 1) {
      setNavSuggestions([]);
      setNavSearching(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      setNavSearching(true);
      const q = term.toLowerCase();
      const suggestions = (Array.isArray(navProductCache) ? navProductCache : [])
        .filter((p) => {
          const name = String(p?.name || "").toLowerCase();
          const sku = String(p?.sku || "").toLowerCase();
          const brand = String(p?.brand || "").toLowerCase();
          const category = String(p?.category || "").toLowerCase();
          return (
            name.includes(q) ||
            sku.includes(q) ||
            brand.includes(q) ||
            category.includes(q)
          );
        })
        .slice(0, 8);
      setNavSuggestions(suggestions);
      setNavSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [navSearch, navProductCache]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!navSearchWrapRef.current) return;
      if (navSearchWrapRef.current.contains(e.target)) return;
      setShowNavSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cartItemCount = useMemo(() => {
    if (!Array.isArray(cart?.products)) return 0;
    return cart.products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const toggleNavDrawer = () => {
    setNavDrawerOpen((v) => !v);
    setMobileSearchOpen(false);
  };
  
  const toggleCartDrawer = () => setDrawerOpen((v) => !v);

  // Shop links (single source of truth)
  const shopLinks = [
    { label: "All", to: "/collections/all" },
    { label: "Fabric", to: "/collections/all?category=Fabric" },
    { label: "Notions", to: "/collections/all?category=Notions" },
    { label: "Patterns", to: "/collections/all?category=Patterns" },
    { label: "Books", to: "/collections/all?category=Books" },
    { label: "Kits", to: "/collections/all?category=Kits" },
  ];

  // Top-level links you asked for
  const mainLinks = [
    { label: "Classes", to: "/classes" },
    { label: "Services", to: "/services" },
    { label: "Rewards", to: "/rewards-program" },
    { label: "About Us", to: "/about" },
    { label: "Contact Us", to: "/contact" },
  ];

  const closeMobileMenu = () => {
    setNavDrawerOpen(false);
    setMobileShopOpen(false);
  };

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between gap-3 py-4 px-4 sm:px-6">
        {/* Left - Logo */}
        <div className="min-w-0 flex-shrink">
          <Link to="/" className="block truncate text-xl font-medium sm:text-2xl">
            Queen Bee Quilts
          </Link>
        </div>

        {/* Center Navigation (Desktop) */}
        <div className="hidden xl:flex items-center space-x-5">
          {/* SHOP DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <button
              type="button"
              className="text-gray-700 hover:text-black text-sm font-medium uppercase inline-flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={shopOpen}
            >
              Shop
              <span className={`transition-transform ${shopOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {shopOpen && (
              <div
                className="absolute left-0 top-full mt-0 w-48 rounded border bg-white shadow-lg z-50"
                role="menu"
              >
                <div className="py-2">
                  {shopLinks.map((l) => (
                    <Link
                      key={l.label}
                      to={l.to}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                      role="menuitem"
                      onClick={() => setShopOpen(false)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Other nav links */}
          {mainLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-gray-700 hover:text-black text-sm font-medium uppercase"
            >
              {l.label}
            </Link>
          ))}

          {/* My Quilts only if logged in */}
          {user && (
            <Link
              to="/my-quilts"
              className="text-gray-700 hover:text-black text-sm font-medium uppercase"
            >
              My Quilts
            </Link>
          )}
        </div>

        {/* Right Icons */}
        <div className="flex items-center space-x-2 sm:space-x-3 xl:space-x-4">
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="block bg-black px-2 rounded text-sm text-white"
            >
              Admin
            </Link>
          )}

            {/* ✅ Inline Search (Desktop) */}
            <div className="hidden xl:flex items-center">
              <div ref={navSearchWrapRef} className="relative w-56 2xl:w-64">
                <input
                  ref={navSearchRef}
                  className="w-full rounded border px-3 py-2 pr-9 text-sm"
                  placeholder="Search products…"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  onFocus={() => setShowNavSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && runNavSearch()}
                />

                {navSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      clearNavSearch();
                      navSearchRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}

                {showNavSuggestions && navSearch.trim() && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-72 overflow-auto rounded border bg-white shadow-lg">
                    {navSearching ? (
                      <div className="px-3 py-2 text-sm text-gray-600">Searching...</div>
                    ) : navSuggestions.length > 0 ? (
                      navSuggestions.map((p) => (
                        <Link
                          key={p._id}
                          to={`/product/${p._id}`}
                          className="block border-b last:border-b-0 px-3 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setShowNavSuggestions(false)}
                        >
                          <div className="truncate font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-600">${Number(p.price || 0).toFixed(2)}</div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-600">No results found.</div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={runNavSearch}
                className="ml-2 rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900"
              >
                Search
              </button>
            </div>
            {/* ✅ Mobile Search Icon (phones) */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                // optional: close menu if open
                // setNavDrawerOpen(false);
              }}
              className="xl:hidden hover:text-black"
              aria-label="Search"
            >
              <HiMagnifyingGlass className="h-7 w-7 text-gray-700" />
            </button>

          {/* Profile Icon + Tooltip */}
          <div className="relative group">
            <Link
              to={user ? "/profile" : "/login"}
              className="hover:text-black inline-flex"
              aria-label={user ? `Hello, ${user.name}` : "Login"}
            >
              {user ? (
                <HiUser className="h-7 w-7 text-blue-600 translate-y-1" />
              ) : (
                <HiOutlineUser className="h-7 w-7 text-gray-700 translate-y-1" />
              )}
            </Link>

            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap
                        rounded bg-blue-700 px-3 py-1 text-xs text-white shadow-md
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        pointer-events-none z-50"
            >
              {user ? `Hello, ${user.name.trim().split(/\s+/)[0]}` : "Login"}
            </div>
          </div>

          {/* Cart Icon */}
          <button onClick={toggleCartDrawer} className="relative hover:text-black">
            <HiOutlineShoppingBag className="h-7 w-7 text-gray-700" />

            {cartItemCount > 0 && (
              <span className="absolute -top-1 bg-rabbit-blue text-white text-xs rounded-full px-2 py-0.5">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu */}
          <button onClick={toggleNavDrawer} className="xl:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </nav>

      {/* ✅ Mobile Search Panel (animated) */}
      {mobileSearchMounted && (
        <div
          className={`xl:hidden overflow-hidden border-t bg-white px-4 transition-all duration-200 ease-out
            ${mobileSearchOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div
            className={`pb-4 transition-all duration-200 ease-out
              ${mobileSearchOpen ? "translate-y-0" : "-translate-y-2"}`}
          >
            <div className="relative mt-3">
              <input
                className="w-full rounded border px-3 py-2 pr-9 text-sm"
                placeholder="Search products…"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onFocus={() => setShowNavSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    runNavSearch();
                    setMobileSearchOpen(false);
                  }
                }}
                autoFocus
              />

              {navSearch && (
                <button
                  type="button"
                  onClick={clearNavSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {showNavSuggestions && navSearch.trim() && (
              <div className="mt-2 max-h-64 overflow-auto rounded border bg-white shadow">
                {navSearching ? (
                  <div className="px-3 py-2 text-sm text-gray-600">Searching...</div>
                ) : navSuggestions.length > 0 ? (
                  navSuggestions.map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/${p._id}`}
                      className="block border-b last:border-b-0 px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setShowNavSuggestions(false);
                        setMobileSearchOpen(false);
                      }}
                    >
                      <div className="truncate font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-600">${Number(p.price || 0).toFixed(2)}</div>
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-600">No results found.</div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                runNavSearch();
                setMobileSearchOpen(false);
              }}
              className="mt-3 w-full rounded bg-blue-700 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={toggleCartDrawer} />

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleNavDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>

          <nav className="space-y-2">
            {/* Mobile SHOP collapsible */}
            <button
              type="button"
              onClick={() => setMobileShopOpen((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-left text-gray-700 font-medium"
            >
              <span>Shop</span>
              <span className={`transition-transform ${mobileShopOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {mobileShopOpen && (
              <div className="pl-3 pb-2 space-y-2">
                {shopLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={closeMobileMenu}
                    className="block text-gray-600 hover:text-black"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Main links */}
            <div className="pt-2 space-y-3">
              {mainLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-black"
                >
                  {l.label}
                </Link>
              ))}

              {/* My Quilts only if logged in */}
              {user && (
                <Link
                  to="/my-quilts"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-black"
                >
                  My Quilts
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;
