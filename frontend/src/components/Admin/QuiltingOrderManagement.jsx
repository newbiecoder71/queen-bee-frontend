import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminQuiltingOrders,
  updateQuiltingOrder,
} from "../../redux/slices/adminQuiltingOrderSlice";
import axios from "axios";
import QuiltingForm from "../../components/Quilting/QuiltingForm";

const QuiltingOrderManagement = () => {
  const dispatch = useDispatch();
  const { quiltingOrders, loading, error } = useSelector(
    (state) => state.adminQuiltingOrders
  );
  const totalQuiltingOrders = quiltingOrders.length;
  const totalQuiltingRevenue = quiltingOrders.reduce(
    (acc, order) => acc + (order.squareInches ? order.squareInches * 0.0125 : 0),
    0
  );

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminQuiltingOrders());
  }, [dispatch]);

  const handleStatusChange = (orderId, status) => {
    dispatch(
      updateQuiltingOrder({quiltingOrderId: orderId, updates: { status } })
    );
  };

  const handleMarkPaid = (orderId) => {
    dispatch(
      updateQuiltingOrder({
        quiltingOrderId: orderId,
        updates: {
          isPaid: true,
          status: "Completed"
        }
      })
    );
  };

  const handleDelete = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quilting order?"
    );
    if (!confirmed) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/quilting-orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        }
      );
      dispatch(fetchAdminQuiltingOrders());
    } catch (err) {
      console.error("Failed to delete quilting order:", err);
      alert("Failed to delete quilting order. Please try again.");
    }
  };

  const getRowClass = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-yellow-100 hover:bg-yellow-200";
      case "Completed":
        return "bg-green-100 hover:bg-green-200";
      default:
        return "hover:bg-gray-50";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quilting Order Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Quilting Order
        </button>
      </div>
      <div className="mb-4 flex gap-6">
        <div className="p-4 shadow-md rounded-lg bg-gray-100">
          <h2 className="text-lg font-semibold">Total Quilting Orders</h2>
          <p className="text-2xl">{totalQuiltingOrders}</p>
        </div>
        <div className="p-4 shadow-md rounded-lg bg-gray-100">
          <h2 className="text-lg font-semibold">Total Quilting Revenue</h2>
          <p className="text-2xl">${totalQuiltingRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        {loading && <p className="text-center py-10">Loading quilting orders...</p>}
        {error && (
          <p className="text-red-600 text-center py-10">Error: {error}</p>
        )}
        {!loading && !error && (
          <table className="min-w-full text-left">
          <thead className="bg-gray-200 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Paid</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quiltingOrders.length > 0 ? (
              quiltingOrders.map((order) => (
                <tr
                  key={order._id}
                  className={`border-b ${getRowClass(order.status)}`}
                >
                  <td className="py-4 px-4 font-medium text-gray-900">
                    #{order._id}
                  </td>
                  <td className="p-4">{order.user?.name || "Unknown"}</td>
                  <td className="p-4">
                    $
                    {order.squareInches
                      ? (order.squareInches * 0.0125).toFixed(2)
                      : "N/A"}
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {order.isPaid ? "Paid" : "Pending"}
                  </td>
                  <td className="p-4 flex gap-2">
                    {!order.isPaid && (
                      <button
                        onClick={() => handleMarkPaid(order._id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Mark as Paid
                      </button>
                    )}
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
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No quilting orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>        
        )}
      </div>

      {/* Modal with QuiltingForm */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <QuiltingForm
              userId={localStorage.getItem("userId")}
              onSuccess={() => {
                dispatch(fetchAdminQuiltingOrders());
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuiltingOrderManagement;