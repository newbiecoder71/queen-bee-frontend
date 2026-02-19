import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role, roles, permission }) => {
    const { user } = useSelector((state) => state.auth);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
      return <Navigate to="/access-denied" replace />;
    }

    if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
      return <Navigate to="/access-denied" replace />;
    }

    if (permission) {
      const permissions = Array.isArray(user.employeePermissions) ? user.employeePermissions : [];
      const canAccess = user.role === "admin" || permissions.includes(permission);
      if (!canAccess) return <Navigate to="/access-denied" replace />;
    }

    return children;
};
export default ProtectedRoute;
