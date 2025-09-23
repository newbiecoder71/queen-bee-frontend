import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchQuiltingOrderById } from "../redux/slices/quiltingOrderSlice";

const MyQuiltsDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { quiltingOrder, loading, error } = useSelector(
    (state) => state.quiltingOrders
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchQuiltingOrderById(id));
    }
  }, [dispatch, id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!quiltingOrder) return <p>No quilting order found</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-6">Quilting Order Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Photo */}
        <div>
          {quiltingOrder.photo ? (
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}${quiltingOrder.photo}`}
              alt={quiltingOrder.pattern || "Quilt"}
              className="w-full h-64 object-cover rounded-lg shadow"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              No photo
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2">
          <p><span className="font-semibold">Order ID:</span> #{quiltingOrder._id}</p>
          <p>
            <span className="font-semibold">Created:</span>{" "}
            {quiltingOrder.createdAt
              ? `${new Date(quiltingOrder.createdAt).toLocaleDateString()} ${new Date(quiltingOrder.createdAt).toLocaleTimeString()}`
              : "N/A"}
          </p>
          <p><span className="font-semibold">User:</span> {quiltingOrder.user?.name || "Unknown User"}</p>
          <p><span className="font-semibold">Pattern:</span> {quiltingOrder.pattern || "N/A"}</p>
          <p>
            <span className="font-semibold">Size:</span>{" "}
            {quiltingOrder.widthInches && quiltingOrder.heightInches
              ? `${quiltingOrder.widthInches}" x ${quiltingOrder.heightInches}" (${quiltingOrder.squareInches} sq in)`
              : "N/A"}
          </p>
          <p>
            <span className="font-semibold">Price:</span>{" "}
            {quiltingOrder.squareInches ? `$${(quiltingOrder.squareInches * 0.0125).toFixed(2)}` : "N/A"}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`${
                quiltingOrder.status === "Completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              } px-2 py-1 rounded-full text-xs sm:text-sm font-medium`}
            >
              {quiltingOrder.status === "Completed" ? "Completed" : "In Progress"}
            </span>
          </p>
          <p>
            <span className="font-semibold">Paid:</span>{" "}
            <span
              className={`${
                quiltingOrder.isPaid
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              } px-2 py-1 rounded-full text-xs sm:text-sm font-medium`}
            >
              {quiltingOrder.isPaid ? "Paid" : "Pending"}
            </span>
          </p>

          {/* Optional details */}
          {quiltingOrder.threadColor && <p><span className="font-semibold">Thread Color:</span> {quiltingOrder.threadColor}</p>}
          {quiltingOrder.backing && <p><span className="font-semibold">Backing:</span> {quiltingOrder.backing}</p>}
          {quiltingOrder.batting && <p><span className="font-semibold">Batting:</span> {quiltingOrder.batting}</p>}
          {quiltingOrder.backingPrep !== undefined && <p><span className="font-semibold">Backing Prep:</span> {quiltingOrder.backingPrep ? "Yes" : "No"}</p>}
          {quiltingOrder.dateDroppedOff && <p><span className="font-semibold">Date Dropped Off:</span> {new Date(quiltingOrder.dateDroppedOff).toLocaleDateString()}</p>}
          {quiltingOrder.datePickedUp && <p><span className="font-semibold">Date Picked Up:</span> {new Date(quiltingOrder.datePickedUp).toLocaleDateString()}</p>}
          {quiltingOrder.notes && <p><span className="font-semibold">Notes:</span> {quiltingOrder.notes}</p>}
        </div>
      </div>
    </div>
  );
};

export default MyQuiltsDetailsPage;