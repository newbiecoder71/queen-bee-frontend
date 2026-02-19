import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminIndexRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const permissions = Array.isArray(user?.employeePermissions) ? user.employeePermissions : [];

  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (permissions.includes("pos.access")) {
    return <Navigate to="/admin/pos" replace />;
  }

  if (permissions.includes("timeclock.access")) {
    return <Navigate to="/admin/time-clock" replace />;
  }

  return <Navigate to="/" replace />;
};

export default AdminIndexRedirect;
