import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PayPalButton from "./PayPalButton";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout, setCheckout } from "../../redux/slices/checkoutSlice";
import axios from "axios";
import { updateCartItemQuantity, removeFromCart } from "../../redux/slices/cartSlice";
import { Link } from "react-router-dom";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [checkoutId, setCheckoutId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    phoneNumber: "",
  });

  // Ensure cart is loaded
  useEffect(() => {
    if (!cart || !cart.products || cart.products.length === 0) {
      navigate("/");
    }
  }, [cart, navigate]);

  // Compute totals
  const subtotal = cart?.totalPrice || 0;
  const tax = +(subtotal * 0.07).toFixed(2);
  const grandTotal = +(subtotal + tax).toFixed(2);

  // Create checkout
  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (!cart || cart.products.length === 0) return;

    const res = await dispatch(
      createCheckout({
        checkoutItems: cart.products,
        shippingAddress,
        paymentMethod: "Paypal",
        totalPrice: subtotal,
        taxes: tax,
        grandTotal: grandTotal,
      })
    );

    if (res.payload && res.payload._id) {
      setCheckoutId(res.payload._id);
    }
  };

  // Handle PayPal success
  const handlePaymentSuccess = async (details) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/pay`,
        { paymentStatus: "paid", paymentDetails: details },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        }
      );

      await handleFinalizeCheckout(checkoutId);
    } catch (error) {
      console.error(error);
    }
  };

  // Finalize checkout
  const handleFinalizeCheckout = async (checkoutId) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/finalize`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        }
      );

      dispatch(setCheckout(data));
      navigate("/order-confirmation");
    } catch (error) {
      console.error(error);
    }
  };

  // Quantity change
  const handleQuantityChange = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    dispatch(updateCartItemQuantity({ productId, quantity: newQuantity }));
  };

  // Remove product
  const handleRemove = (productId) => {
    dispatch(removeFromCart({ productId }));
  };

  if (loading) return <p>Loading cart ...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!cart || !cart.products || cart.products.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Left Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>

        {/* FORM */}
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              className="w-full p-2 border rounded"
              disabled
            />
          </div>

          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, address: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, city: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Zip Code</label>
              <input
                type="text"
                value={shippingAddress.zipCode}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              type="text"
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, country: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Phone Number</label>
            <input
              type="text"
              value={shippingAddress.phoneNumber}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mt-6">
            {!checkoutId ? (
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors"
              >
                Continue to Payment
              </button>
            ) : (
              <div>
                <h3 className="text-lg mb-4">Pay with PayPal</h3>
                <PayPalButton
                  amount={grandTotal}
                  checkoutId={checkoutId}
                  onSuccess={handlePaymentSuccess}
                  onError={(err) => console.error("PayPal Error:", err)}
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Right Section - Order Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>
        <div className="border-t py-4 mb-4">
          {cart.products.map((product, index) => (
            <div key={index} className="flex items-start justify-between py-2 border-b">
              <div className="flex items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover mr-4"
                />
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() =>
                        handleQuantityChange(product.productId, product.quantity, -1)
                      }
                      className="px-2 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span>{product.quantity}</span>
                    <button
                      onClick={() =>
                        handleQuantityChange(product.productId, product.quantity, 1)
                      }
                      className="px-2 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(product.productId)}
                    className="text-red-500 text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-xl">${Number(product.price).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-lg mb-2">
          <p>Subtotal</p>
          <p>${subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center text-lg mb-2">
          <p>Tax (7%)</p>
          <p>${tax.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4 font-bold">
          <p>Total</p>
          <p>${grandTotal.toFixed(2)}</p>
        </div>
        <div className="text-center mb-6">
          <Link
            to="/collections/all"
            className="text-blue-500 font-semibold hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Checkout;