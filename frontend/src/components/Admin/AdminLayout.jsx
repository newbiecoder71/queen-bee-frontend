import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import AdminSidebar from "./AdminSidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const desktopSidebarRef = useRef(null);
  const mainContentRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (!isDesktopSidebarOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!desktopSidebarRef.current) return;
      if (desktopSidebarRef.current.contains(event.target)) return;

      // Let first-click actions in main content (buttons/inputs/links) execute
      // without being swallowed by sidebar close behavior.
      const interactiveSelector =
        "button, a, input, select, textarea, label, [role='button'], [data-no-sidebar-close]";
      if (
        mainContentRef.current &&
        mainContentRef.current.contains(event.target) &&
        event.target.closest(interactiveSelector)
      ) {
        return;
      }

      setIsDesktopSidebarOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDesktopSidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
        {/* Desktop Toggle Button (only when sidebar is collapsed) */}
        {!isDesktopSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsDesktopSidebarOpen(true)}
            className="hidden md:flex fixed top-4 left-4 z-40 items-center justify-center rounded bg-gray-900 p-2 text-white shadow hover:bg-gray-800"
            aria-label="Open sidebar"
          >
            <FaBars size={18} />
          </button>
        )}

        {/* Mobile Toggle Button */}
        <div className="flex md:hidden p-4 bg-gray-900 text-white z-20">
            <button onClick={toggleSidebar}>
                <FaBars size={24} />
            </button>
            <Link to="/admin">
                <h1 className="ml-4 text-xl font-medium">Admin Dashboard</h1>
            </Link>
        </div>

        {/* Overlay for Mobile Sidebar */}
        {isSidebarOpen && (
            <div className="fixed inset-0 z-10 bg-black bg-opacity-50 md:hidden" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar */}
        <div ref={desktopSidebarRef} className={`bg-gray-900 w-64 min-h-screen text-white absolute transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-all duration-300 md:translate-x-0 md:static md:block z-20 ${
              isDesktopSidebarOpen ? "md:w-64" : "md:w-0 md:overflow-hidden"
            }`}
        >
            {/* Sidebar */}
            <AdminSidebar
              onDesktopToggle={() => setIsDesktopSidebarOpen((prev) => !prev)}
              showDesktopToggle={isDesktopSidebarOpen}
            />
        </div>

        {/* Main Content */}
        <div ref={mainContentRef} className="flex-grow p-6 overflow-auto md:pt-4">
            <Outlet />
        </div>
    </div>
  );
};

export default AdminLayout;

