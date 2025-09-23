import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllOrders, updateOrderStatus, deleteOrder } from "../../redux/slices/adminOrderSlice";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.adminOrders);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, user, navigate]);

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({ id: orderId, status }));
  };

  const handleDelete = (orderId) => {
    const confirmed = window.confirm("Are you sure you want to delete this order?");
    if (confirmed) {
      dispatch(deleteOrder(orderId));
    }
  };

  const handleRetry = () => {
    dispatch(fetchAllOrders());
  };

  const getRowClass = (status) => {
    switch (status) {
      case "Processing":
        return "bg-yellow-100 hover:bg-yellow-200";
      case "Shipped":
        return "bg-blue-100 hover:bg-blue-200";
      case "Delivered":
        return "bg-green-100 hover:bg-green-200";
      case "Cancelled":
        return "bg-red-100 hover:bg-red-200";
      default:
        return "hover:bg-gray-50";
    }
  };

  if (loading) return (
    <div className="text-center py-10">
      <p className="text-gray-600">Loading orders...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-600 mb-4">Error: {error}</p>
      <button onClick={handleRetry} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Retry
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full text-left bg-gray-100">
          <thead className="bg-gray-200 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id} className={`border-b ${getRowClass(order.status)}`}>
                  <td className="py-4 px-4 font-medium text-gray-900">#{order._id}</td>
                  <td className="p-4">{order.user.name}</td>
                  <td className="p-4">${order.grandTotal.toFixed(2)}</td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleStatusChange(order._id, "Delivered")}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Mark as Delivered
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No Orders Found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;