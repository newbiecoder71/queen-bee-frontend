import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaClipboardList,
  FaSignOutAlt,
  FaStore,
  FaUser,
  FaThLarge,
  FaEnvelope,
  FaEnvelopeOpenText
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";
import { fetchNewMessageCount } from "../../redux/slices/messagesSlice";
import { fetchNewSubscriberCount } from "../../redux/slices/newsletterSlice";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ new messages count from redux
  const { newCount } = useSelector((state) => state.messages);

  useEffect(() => {
    // load once
    dispatch(fetchNewMessageCount());

    // optional: refresh while admin is browsing
    const t = setInterval(() => dispatch(fetchNewMessageCount()), 30000);
    return () => clearInterval(t);
  }, [dispatch]);

  const { newCount: newEmailCount } = useSelector((state) => state.newsletter);

  useEffect(() => {
    dispatch(fetchNewSubscriberCount());
    const t = setInterval(() => dispatch(fetchNewSubscriberCount()), 30000);
    return () => clearInterval(t);
  }, [dispatch]);

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
      <div className="mb-6">
        <Link to="/" className="text-2xl font-medium">
          Queen Bee Quilts
        </Link>
      </div>

      <Link to="/admin">
        <h2 className="text-xl font-medium mb-6 text-center">Admin Dashboard</h2>
      </Link>

      <nav className="flex flex-col space-y-2">
        <NavLink to="/admin/users" className={navClass}>
          <FaUser />
          <span>Users</span>
        </NavLink>

        <NavLink to="/admin/products" className={navClass}>
          <FaBoxOpen />
          <span>Products</span>
        </NavLink>

        <NavLink to="/admin/orders" className={navClass}>
          <FaClipboardList />
          <span>Orders</span>
        </NavLink>

        <NavLink to="/admin/quilting-orders" className={navClass}>
          <FaThLarge />
          <span>Quilting Orders</span>
        </NavLink>

        {/* ✅ Messages with badge */}
        <NavLink to="/admin/messages" className={navClass}>
          <FaEnvelope />
          <span className="flex-1">Messages</span>

          {newCount > 0 && (
            <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              {newCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/admin/subscribers" className={navClass}>
          <FaEnvelopeOpenText />
          <span className="flex-1">Subscribers</span>

          {newEmailCount > 0 && (
            <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              {newEmailCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/collections/all" className={navClass}>
          <FaStore />
          <span>Shop</span>
        </NavLink>
      </nav>

      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
