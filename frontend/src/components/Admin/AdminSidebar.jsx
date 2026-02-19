import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaClipboardList,
  FaSignOutAlt,
  FaStore,
  FaUser,
  FaThLarge,
  FaEnvelope,
  FaEnvelopeOpenText,
  FaCashRegister,
  FaMedal,
  FaRegClock,
  FaUserCog,
  FaCogs,
  FaBars,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";
import { fetchNewMessageCount } from "../../redux/slices/messagesSlice";
import { fetchNewSubscriberCount } from "../../redux/slices/newsletterSlice";

const AdminSidebar = ({ onDesktopToggle, showDesktopToggle = false }) => {
  const navigate = useNavigate();
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
  const switchedRole = String(posEmployeeContext?.employeeRole || "").trim().toLowerCase();
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
    adminSidebarMode || (!posScopedEmployeeMode ? permissions.includes("products.view") : !switchedIsCashier && permissions.includes("products.view"));
  const canOrders = adminSidebarMode || permissions.includes("orders.view");
  const canRewards = adminSidebarMode || permissions.includes("customer_rewards.view");
  const dashboardLink = isAdmin
    ? "/admin/dashboard"
    : canPos
    ? "/admin/pos"
    : canTimeClock
    ? "/admin/time-clock"
    : "/admin/dashboard";

  // ✅ new messages count from redux
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
        <h2 className="text-xl font-medium mb-6 text-center">
          {isAdmin ? "Admin Dashboard" : "Employee Dashboard"}
        </h2>
      </Link>

      <nav className="flex flex-col space-y-2">
        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/employees" className={navClass}>
            <FaUserCog />
            <span>Employees</span>
          </NavLink>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/customers" className={navClass}>
            <FaUser />
            <span>Customers</span>
          </NavLink>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/settings" className={navClass}>
            <FaCogs />
            <span>Settings</span>
          </NavLink>
        )}

        {canProducts && (
          <NavLink to="/admin/products" className={navClass}>
            <FaBoxOpen />
            <span>Products</span>
          </NavLink>
        )}

        {canOrders && (
          <NavLink to="/admin/orders" className={navClass}>
            <FaClipboardList />
            <span>Orders</span>
          </NavLink>
        )}

        {canPos && (
          <NavLink to="/admin/pos" className={navClass}>
            <FaCashRegister />
            <span>POS</span>
          </NavLink>
        )}

        {canTimeClock && (
          <NavLink to="/admin/time-clock" className={navClass}>
            <FaRegClock />
            <span>Time Clock</span>
          </NavLink>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/time-clock-tracking" className={navClass}>
            <FaRegClock />
            <span>Employee Tracking</span>
          </NavLink>
        )}

        {canRewards && (
          <NavLink to="/admin/customer-rewards" className={navClass}>
            <FaMedal />
            <span>Customer Rewards</span>
          </NavLink>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/quilting-orders" className={navClass}>
            <FaThLarge />
            <span>Quilting Orders</span>
          </NavLink>
        )}

        {/* ✅ Messages with badge */}
        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/messages" className={navClass}>
            <FaEnvelope />
            <span className="flex-1">Messages</span>

            {newCount > 0 && (
              <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                {newCount}
              </span>
            )}
          </NavLink>
        )}

        {!posScopedEmployeeMode && isAdmin && (
          <NavLink to="/admin/subscribers" className={navClass}>
            <FaEnvelopeOpenText />
            <span className="flex-1">Subscribers</span>

            {newEmailCount > 0 && (
              <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                {newEmailCount}
              </span>
            )}
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
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2"
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
