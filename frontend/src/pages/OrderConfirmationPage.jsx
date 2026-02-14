import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout } = useSelector((state) => state.checkout);

  // Clear the cart when the order is confirmed
  useEffect(() => {
    if (checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
    } else {
      navigate("/my-order"); // fallback if checkout doesn't exist
    }
  }, [checkout, dispatch, navigate]);

  const calculateEstimatedDelivery = (createdAt) => {
    if (!createdAt) return "-";
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10); // Add 10 days
    return orderDate.toLocaleDateString();
  };

  if (!checkout) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white text-center">
        <p>Loading order details...</p>
      </div>
    );
  }

  const items = checkout.checkoutItems || checkout.orderItems || [];
  const grandTotal = Number(checkout.grandTotal || 0);
  const tax = Number(checkout.taxes || 0);
  const subtotal = Number((grandTotal - tax).toFixed(2));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">
        Thank you for your Order!
      </h1>

      <div className="p-6 rounded-lg border">
        {/* Order Id and Date */}
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold">Order Id: {checkout._id}</h2>
            <p className="text-gray-500">
              Order Date: {checkout.createdAt ? new Date(checkout.createdAt).toLocaleDateString() : "-"}
            </p>
          </div>
          <div>
            <p className="text-emerald-700 text-sm">
              Estimated Delivery: {calculateEstimatedDelivery(checkout.createdAt)}
            </p>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="mb-8">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <div key={item.productId || item.quiltingOrderId || idx} className="flex items-center mb-4">
                <img
                  src={
                    item.image?.startsWith("/uploads")
                      ? `${import.meta.env.VITE_BACKEND_URL}${item.image}`
                      : item.image || "/placeholder.png"
                  }
                  alt={item.name || "Product"}
                  className="w-16 h-16 object-cover rounded-md mr-4"
                />
                <div className="ml-auto text-right">
                  <p className="text-md">${item.price?.toFixed(2) || "0.00"}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity || 0}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No items found in this order.</p>
          )}
        </div>

        {/* Totals */}
        <div className="mb-6 border-t pt-4 space-y-2">
          <div className="flex justify-between text-lg">
            <p>Subtotal</p>
            <p>${subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-lg">
            <p>Tax</p>
            <p>${tax.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <p>Grand Total</p>
            <p>${grandTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment & Delivery Info */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment</h4>
            <p className="text-gray-600">{checkout.paymentMethod || "Unknown"}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Delivery</h4>
            <p className="text-gray-600">{checkout.shippingAddress?.address || "-"}</p>
            <p className="text-gray-600">
              {checkout.shippingAddress?.city || "-"}, {checkout.shippingAddress?.country || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
