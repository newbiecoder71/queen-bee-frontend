import { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
  updateOrderCustomer,
} from "../../redux/slices/adminOrderSlice";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.adminOrders);
  const [assignOrderId, setAssignOrderId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [assigningCustomer, setAssigningCustomer] = useState(false);
  const [assignError, setAssignError] = useState("");

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

  const openAssignCustomer = (orderId) => {
    setAssignOrderId(orderId);
    setCustomerQuery("");
    setCustomerResults([]);
    setSelectedCustomer(null);
    setAssignError("");
  };

  const closeAssignCustomer = () => {
    setAssignOrderId("");
    setCustomerQuery("");
    setCustomerResults([]);
    setSelectedCustomer(null);
    setAssignError("");
  };

  const searchCustomers = async () => {
    const q = String(customerQuery || "").trim();
    if (q.length < 2) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    setAssignError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/admin/search?q=${encodeURIComponent(q)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to search customers.");
      setCustomerResults(
        Array.isArray(data) ? data.filter((u) => String(u.role || "") === "customer") : []
      );
    } catch (err) {
      setAssignError(err.message || "Failed to search customers.");
      setCustomerResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const handleSaveAssignedCustomer = async () => {
    if (!assignOrderId || !selectedCustomer?._id) return;
    setAssigningCustomer(true);
    setAssignError("");
    try {
      await dispatch(
        updateOrderCustomer({ id: assignOrderId, customerUserId: selectedCustomer._id })
      ).unwrap();
      closeAssignCustomer();
    } catch (err) {
      setAssignError(String(err || "Failed to assign customer."));
    } finally {
      setAssigningCustomer(false);
    }
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
                  <td className="p-4">
                    {order.user?.name || "Unknown User"}
                    <div className="text-xs text-gray-600">{order.user?.email || "N/A"}</div>
                  </td>
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
                    <button
                      onClick={() => openAssignCustomer(order._id)}
                      className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
                    >
                      Assign Customer
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

      {assignOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Assign Customer to Order</h3>
            <p className="text-sm text-gray-600 mb-3">
              Search by customer name/email and save to update rewards/lifetime spend.
            </p>

            <div className="flex gap-2 mb-2">
              <input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  searchCustomers();
                }}
                className="flex-1 rounded border px-3 py-2 text-sm"
                placeholder="Search customers..."
              />
              <button
                type="button"
                onClick={searchCustomers}
                className="rounded bg-purple-fill px-3 py-2 text-sm font-semibold text-white hover:bg-purple-900"
              >
                {searchingCustomers ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="max-h-64 overflow-auto rounded border">
              {customerResults.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No customers found.</div>
              ) : (
                customerResults.map((cust) => (
                  <button
                    key={cust._id}
                    type="button"
                    onClick={() => setSelectedCustomer(cust)}
                    className={`w-full border-b last:border-b-0 px-3 py-2 text-left ${
                      selectedCustomer?._id === cust._id ? "bg-indigo-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-sm">{cust.name}</div>
                    <div className="text-xs text-gray-600">{cust.email}</div>
                  </button>
                ))
              )}
            </div>

            {assignError && <div className="mt-3 text-sm text-red-600">{assignError}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAssignCustomer}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedCustomer}
                disabled={!selectedCustomer?._id || assigningCustomer}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {assigningCustomer ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

