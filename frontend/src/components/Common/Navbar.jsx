import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";

import SearchBar from "./SearchBar";
import CartDrawer from "../Layout/CartDrawer";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  // desktop dropdown
  const [shopOpen, setShopOpen] = useState(false);

  // mobile collapsible section
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const cartItemCount = useMemo(() => {
    if (!Array.isArray(cart?.products)) return 0;
    return cart.products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const toggleNavDrawer = () => setNavDrawerOpen((v) => !v);
  const toggleCartDrawer = () => setDrawerOpen((v) => !v);

  // Shop links (single source of truth)
  const shopLinks = [
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
    { label: "About Us", to: "/about" },
    { label: "Contact Us", to: "/contact" },
  ];

  const closeMobileMenu = () => {
    setNavDrawerOpen(false);
    setMobileShopOpen(false);
  };

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* Left - Logo */}
        <div>
          <Link to="/" className="text-2xl font-medium">
            Queen Bee Quilts
          </Link>
        </div>

        {/* Center Navigation (Desktop) */}
        <div className="hidden md:flex items-center space-x-6">
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
        <div className="flex items-center space-x-4">
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="block bg-black px-2 rounded text-sm text-white"
            >
              Admin
            </Link>
          )}

          {/* Profile Icon + Tooltip */}
          <div className="relative group">
            <Link
              to={user ? "/profile" : "/login"}
              className="hover:text-black inline-flex"
              aria-label={user ? `Hello, ${user.name}` : "Login"}
            >
              <HiOutlineUser className="h-7 w-7 text-gray-700 translate-y-1" />
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

          {/* Search */}
          <div className="overflow-hidden">
            <SearchBar />
          </div>

          {/* Mobile Menu */}
          <button onClick={toggleNavDrawer} className="md:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </nav>

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
