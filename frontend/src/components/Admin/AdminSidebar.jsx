import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBoxOpen,
  FaCashRegister,
  FaChevronDown,
  FaCogs,
  FaGift,
  FaNewspaper,
  FaPalette,
  FaSignOutAlt,
  FaStore,
  FaUser,
  FaUserCog,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";
import { fetchNewMessageCount } from "../../redux/slices/messagesSlice";
import { fetchNewSubscriberCount } from "../../redux/slices/newsletterSlice";

const AdminSidebar = ({ onDesktopToggle, showDesktopToggle = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const POS_ACTIVE_EMPLOYEE_CONTEXT_KEY = "posActiveEmployeeContext";
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const [posEmployeeContext, setPosEmployeeContext] = useState(null);

  useEffect(() => {
    const syncContext = () => {
      try {
        const raw = localStorage.getItem(POS_ACTIVE_EMPLOYEE_CONTEXT_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        setPosEmployeeContext(parsed || null);
      } catch {
        setPosEmployeeContext(null);
      }
    };

    syncContext();
    window.addEventListener("pos-employee-changed", syncContext);
    return () => window.removeEventListener("pos-employee-changed", syncContext);
  }, []);

  const isPosSwitchedToDifferentEmployee =
    Boolean(posEmployeeContext?._id) &&
    String(posEmployeeContext?._id) !== String(user?._id || "");
  const switchedRole = String(posEmployeeContext?.employeeRole || "")
    .trim()
    .toLowerCase();
  const switchedIsManager = switchedRole === "manager";
  const switchedIsCashier = switchedRole === "cashier";

  const posScopedEmployeeMode =
    !isAdmin || (isPosSwitchedToDifferentEmployee && !switchedIsManager);
  const adminSidebarMode = isAdmin && !posScopedEmployeeMode;

  const permissions = posScopedEmployeeMode
    ? Array.isArray(posEmployeeContext?.permissions)
      ? posEmployeeContext.permissions
      : []
    : Array.isArray(user?.employeePermissions)
    ? user.employeePermissions
    : [];
  const canPos = adminSidebarMode || permissions.includes("pos.access");
  const canTimeClock = adminSidebarMode || permissions.includes("timeclock.access");
  const canProducts =
    adminSidebarMode ||
    (!posScopedEmployeeMode
      ? permissions.includes("products.view")
      : !switchedIsCashier && permissions.includes("products.view"));
  const canOrders = adminSidebarMode || permissions.includes("orders.view");
  const canRewards = adminSidebarMode || permissions.includes("customer_rewards.view");
  const dashboardLink = isAdmin
    ? "/admin/dashboard"
    : canPos
    ? "/admin/pos"
    : canTimeClock
    ? "/admin/time-clock"
    : "/admin/dashboard";

  const { newCount } = useSelector((state) => state.messages);

  useEffect(() => {
    if (!isAdmin) return undefined;
    dispatch(fetchNewMessageCount());
    const t = setInterval(() => dispatch(fetchNewMessageCount()), 30000);
    return () => clearInterval(t);
  }, [dispatch, isAdmin]);

  const { newCount: newEmailCount } = useSelector((state) => state.newsletter);

  useEffect(() => {
    if (!isAdmin) return undefined;
    dispatch(fetchNewSubscriberCount());
    const t = setInterval(() => dispatch(fetchNewSubscriberCount()), 30000);
    return () => clearInterval(t);
  }, [dispatch, isAdmin]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "bg-gray-700 text-white py-3 px-4 rounded flex items-center space-x-2"
      : "text-gray-300 hover:bg-gray-700 hover:text-white py-3 px-4 rounded flex items-center space-x-2";

  const groupButtonClass =
    "w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white py-3 px-4 rounded flex items-center justify-between gap-2";
  const groupChildClass =
    "ml-6 mt-1 flex flex-col space-y-1 border-l border-gray-700 pl-3";
  const hasActiveChild = (paths) => paths.some((path) => location.pathname === path);

  const [openGroups, setOpenGroups] = useState(() => ({
    employees: false,
    customers: false,
    products: false,
    marketing: false,
    settings: false,
  }));

  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      employees:
        prev.employees ||
        hasActiveChild([
          "/admin/employees",
          "/admin/time-clock",
          "/admin/time-clock-tracking",
        ]),
      customers:
        prev.customers ||
        hasActiveChild(["/admin/customers", "/admin/customer-rewards"]),
      products:
        prev.products ||
        hasActiveChild([
          "/admin/products",
          "/admin/orders",
          "/admin/quilting-orders",
          "/admin/gift-cards",
        ]),
      marketing:
        prev.marketing ||
        hasActiveChild(["/admin/newsletters", "/admin/messages", "/admin/subscribers"]),
      settings:
        prev.settings || hasActiveChild(["/admin/settings", "/admin/theme"]),
    }));
  }, [location.pathname]);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <Link to="/" className="text-xl font-medium whitespace-nowrap">
          Queen Bee Quilts
        </Link>
        {showDesktopToggle && (
          <button
            type="button"
            onClick={onDesktopToggle}
            className="hidden md:inline-flex items-center justify-center rounded bg-gray-800 p-2 text-white shadow hover:bg-gray-700"
            aria-label="Collapse sidebar"
          >
            <FaBars />
          </button>
        )}
      </div>

      <Link to={dashboardLink}>
        <h2 className="mb-6 text-center text-xl font-medium">
          {isAdmin ? "Admin Dashboard" : "Employee Dashboard"}
        </h2>
      </Link>

      <nav className="flex flex-col space-y-2">
        {!posScopedEmployeeMode && isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => toggleGroup("employees")}
              className={groupButtonClass}
              aria-expanded={openGroups.employees}
            >
              <span className="flex items-center gap-2">
                <FaUserCog />
                <span>Employees</span>
              </span>
              <FaChevronDown
                className={`transition-transform ${
                  openGroups.employees ? "rotate-180" : ""
                }`}
              />
            </button>
            {openGroups.employees && (
              <div className={groupChildClass}>
                <NavLink to="/admin/employees" className={navClass}>
                  <span>Edit Employees</span>
                </NavLink>
                {canTimeClock && (
                  <NavLink to="/admin/time-clock" className={navClass}>
                    <span>Time Clock</span>
                  </NavLink>
                )}
                <NavLink to="/admin/time-clock-tracking" className={navClass}>
                  <span>Employee Tracking</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => toggleGroup("customers")}
              className={groupButtonClass}
              aria-expanded={openGroups.customers}
            >
              <span className="flex items-center gap-2">
                <FaUser />
                <span>Customers</span>
              </span>
              <FaChevronDown
                className={`transition-transform ${
                  openGroups.customers ? "rotate-180" : ""
                }`}
              />
            </button>
            {openGroups.customers && (
              <div className={groupChildClass}>
                <NavLink to="/admin/customers" className={navClass}>
                  <span>Edit Customers</span>
                </NavLink>
                {canRewards && (
                  <NavLink to="/admin/customer-rewards" className={navClass}>
                    <span>Customer Rewards</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => toggleGroup("products")}
              className={groupButtonClass}
              aria-expanded={openGroups.products}
            >
              <span className="flex items-center gap-2">
                <FaBoxOpen />
                <span>Products</span>
              </span>
              <FaChevronDown
                className={`transition-transform ${
                  openGroups.products ? "rotate-180" : ""
                }`}
              />
            </button>
            {openGroups.products && (
              <div className={groupChildClass}>
                <NavLink to="/admin/products" className={navClass}>
                  <span>Products</span>
                </NavLink>
                {canOrders && (
                  <NavLink to="/admin/orders" className={navClass}>
                    <span>Orders</span>
                  </NavLink>
                )}
                {!posScopedEmployeeMode && isAdmin && (
                  <NavLink to="/admin/quilting-orders" className={navClass}>
                    <span>Quilting Orders</span>
                  </NavLink>
                )}
                {!posScopedEmployeeMode && isAdmin && (
                  <NavLink to="/admin/gift-cards" className={navClass}>
                    <span>Gift Cards</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => toggleGroup("marketing")}
              className={groupButtonClass}
              aria-expanded={openGroups.marketing}
            >
              <span className="flex items-center gap-2">
                <FaNewspaper />
                <span>Marketing</span>
              </span>
              <FaChevronDown
                className={`transition-transform ${
                  openGroups.marketing ? "rotate-180" : ""
                }`}
              />
            </button>
            {openGroups.marketing && (
              <div className={groupChildClass}>
                <NavLink to="/admin/newsletters" className={navClass}>
                  <span>Newsletters</span>
                </NavLink>
                <NavLink to="/admin/messages" className={navClass}>
                  <span className="flex-1">Messages</span>
                  {newCount > 0 && (
                    <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {newCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/admin/subscribers" className={navClass}>
                  <span className="flex-1">Subscribers</span>
                  {newEmailCount > 0 && (
                    <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {newEmailCount}
                    </span>
                  )}
                </NavLink>
              </div>
            )}
          </div>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => toggleGroup("settings")}
              className={groupButtonClass}
              aria-expanded={openGroups.settings}
            >
              <span className="flex items-center gap-2">
                <FaCogs />
                <span>Settings</span>
              </span>
              <FaChevronDown
                className={`transition-transform ${
                  openGroups.settings ? "rotate-180" : ""
                }`}
              />
            </button>
            {openGroups.settings && (
              <div className={groupChildClass}>
                <NavLink to="/admin/settings" className={navClass}>
                  <span>Settings</span>
                </NavLink>
                <NavLink to="/admin/theme" className={navClass}>
                  <span>Theme</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {canPos && (
          <NavLink to="/admin/pos" className={navClass}>
            <FaCashRegister />
            <span>POS</span>
          </NavLink>
        )}

        {!posScopedEmployeeMode && (
          <NavLink to="/collections/all" className={navClass}>
            <FaStore />
            <span>Shop</span>
          </NavLink>
        )}
      </nav>

      {!posScopedEmployeeMode && (
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
