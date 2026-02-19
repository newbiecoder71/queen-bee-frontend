import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserQuiltingOrders } from "../redux/slices/quiltingOrderSlice";
import QuiltingForm from "../components/Quilting/QuiltingForm";

const MyQuiltsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { quiltingOrders, loading, error } = useSelector(
    (state) => state.quiltingOrders
  );
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=my-quilts");
      return;
    }
    dispatch(fetchUserQuiltingOrders());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (!error) return;
    const msg = String(error).toLowerCase();
    if (msg.includes("not authorized") || msg.includes("token failed")) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userId");
      navigate("/login?redirect=my-quilts");
    }
  }, [error, navigate]);

  const handleRowClick = (quiltingOrderId) => {
    navigate(`/my-quilts/${quiltingOrderId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">My Quilts</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Quilting Order
        </button>
      </div>

      {/* Table */}
      <div className="relative shadow-md sm:rounded-lg overflow-hidden">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <table className="min-w-full text-left text-gray-500">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="py-2 px-4 sm:py-3">Quilt</th>
                <th className="py-2 px-4 sm:py-3">Order Id</th>
                <th className="py-2 px-4 sm:py-3">Created</th>
                <th className="py-2 px-4 sm:py-3">User</th>
                <th className="py-2 px-4 sm:py-3">Pattern</th>
                <th className="py-2 px-4 sm:py-3">Price</th>
                <th className="py-2 px-4 sm:py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {quiltingOrders.length > 0 ? (
                quiltingOrders.map((quiltingOrder) => {
                  const storedTotal = Number(quiltingOrder.totalPrice || 0);
                  const squareInches = Number(quiltingOrder.squareInches || 0);
                  const derivedSquareInches =
                    squareInches > 0
                      ? squareInches
                      : Number(quiltingOrder.widthInches || 0) * Number(quiltingOrder.heightInches || 0);
                  const derivedTotal =
                    derivedSquareInches > 0
                      ? derivedSquareInches * 0.0125 + (quiltingOrder.backingPrep ? 10 : 0)
                      : 0;
                  const finalTotal = storedTotal > 0 ? storedTotal : derivedTotal;
                  const price = finalTotal > 0 ? finalTotal.toFixed(2) : "N/A";

                  return (
                    <tr
                      key={quiltingOrder._id}
                      onClick={() => handleRowClick(quiltingOrder._id)}
                      className="border-b hover:border-gray-50 cursor-pointer"
                    >
                      <td className="py-2 px-2 sm:py-4 sm:px-4">
                        {quiltingOrder.photo ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_URL}${quiltingOrder.photo}`}
                            alt={quiltingOrder.pattern || "Quilt"}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400">No image</span>
                        )}
                      </td>
                      <td className="py-2 px-2 sm:py-4 sm:px-4 font-medium text-gray-500 whitespace-nowrap">
                        #{quiltingOrder._id}
                      </td>
                      <td className="py-2 px-2 sm:py-4 sm:px-4">
                        {new Date(quiltingOrder.createdAt).toLocaleDateString()}{" "}
                        {new Date(quiltingOrder.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2 sm:py-4 sm:px-4">
                        {quiltingOrder.user.name || "Unknown User"}
                      </td>
                      <td className="py-2 px-2 sm:py-4 sm:px-4">
                        {quiltingOrder.pattern || "N/A"}
                      </td>
                      <td className="py-2 px-2 sm:py-4 sm:px-4">
                        {price !== "N/A" ? `$${price}` : "N/A"}
                      </td>
                      <td className="py-2 px-2 sm:py-4 sm:px-4">
                        <span
                          className={`${
                            quiltingOrder.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          } px-2 py-1 rounded-full text-xs sm:text-sm font-medium`}
                        >
                          {quiltingOrder.status === "Completed"
                            ? "Completed"
                            : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 px-4 text-center text-gray-500"
                  >
                    You have no quilting orders
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
                dispatch(fetchUserQuiltingOrders());
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

export default MyQuiltsPage;
