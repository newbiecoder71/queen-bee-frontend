import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import PayPalButton from "./PayPalButton";
import { useDispatch, useSelector } from "react-redux";
import {
  createCheckout,
  setCheckout,
} from "../../redux/slices/checkoutSlice";
import axios from "axios";
import {
  updateCartItemQuantity,
  removeFromCart,
} from "../../redux/slices/cartSlice";
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

  /* ---------------------------------------------------------
   * SAFE CART CHECK (avoids redirect flickering)
   * --------------------------------------------------------- */
  useEffect(() => {
    if (loading) return; // don't check yet

    // if user removed items and cart is now empty, redirect home
    if (!cart || !Array.isArray(cart.products) || cart.products.length === 0) {
      navigate("/");
    }
  }, [cart, loading, navigate]);

  /* ---------------------------------------------------------
   * TOTALS CALCULATION (matches backend tax: 8.1%)
   * --------------------------------------------------------- */
  const subtotal = useMemo(() => {
    if (!cart || !cart.products) return 0;
    return cart.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [cart]);

  const TAX_RATE = 0.081;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const grandTotal = +(subtotal + tax).toFixed(2);

  /* ---------------------------------------------------------
   * CREATE CHECKOUT (Step 1)
   * --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
   * PAYPAL SUCCESS → Mark checkout paid (Step 2)
   * --------------------------------------------------------- */
  const handlePaymentSuccess = async (details) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/pay`,
        {
          paymentStatus: "paid",
          paymentDetails: details,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      await handleFinalizeCheckout(checkoutId);
    } catch (err) {
      console.error("Payment success error:", err);
    }
  };

  /* ---------------------------------------------------------
   * FINALIZE CHECKOUT → Create Order (Step 3)
   * --------------------------------------------------------- */
  const handleFinalizeCheckout = async (checkoutId) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/finalize`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      dispatch(setCheckout(data));
      navigate("/order-confirmation");
    } catch (err) {
      console.error("Finalize checkout error:", err);
    }
  };

  /* ---------------------------------------------------------
   * CHANGE QUANTITY INSIDE CHECKOUT
   * --------------------------------------------------------- */
  const handleQuantityChange = (productId, currentQuantity, delta) => {
    const newQty = currentQuantity + delta;
    if (newQty < 1) return;

    dispatch(
      updateCartItemQuantity({
        productId,
        quantity: newQty,
      })
    );
  };

  /* ---------------------------------------------------------
   * REMOVE FROM CART INSIDE CHECKOUT
   * --------------------------------------------------------- */
  const handleRemove = (productId) => {
    dispatch(removeFromCart({ productId }));
  };

  /* ---------------------------------------------------------
   * LOADING / ERROR HANDLING
   * --------------------------------------------------------- */
  if (loading) return <p className="text-center py-6">Loading cart...</p>;

  if (error)
    return (
      <p className="text-center text-red-600 py-6">
        Error loading cart: {error}
      </p>
    );

  if (!cart || !cart.products || cart.products.length === 0) {
    return <p className="text-center py-6">Your cart is empty.</p>;
  }

  /* ---------------------------------------------------------
   * RENDER CHECKOUT PAGE
   * --------------------------------------------------------- */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* ---------------- LEFT: CONTACT + SHIPPING ---------------- */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>

        {/* FORM */}
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>

          {/* Email (disabled) */}
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              className="w-full p-2 border rounded"
              disabled
            />
          </div>

          {/* ---------------- SHIPPING FIELDS ---------------- */}
          <h3 className="text-lg mb-4">Delivery</h3>

          {/* First + Last Name */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                required
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                required
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              required
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* City + Zip */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                required
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Zip Code</label>
              <input
                required
                value={shippingAddress.zipCode}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    zipCode: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Country */}
          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              required
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  country: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-gray-700">Phone Number</label>
            <input
              required
              value={shippingAddress.phoneNumber}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  phoneNumber: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* BUTTON: Continue to Payment */}
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

      {/* ---------------- RIGHT: ORDER SUMMARY ---------------- */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>

        <div className="border-t py-4 mb-4">
          {cart.products.map((product) => (
            <div
              key={product.productId}
              className="flex items-start justify-between py-2 border-b"
            >
              <div className="flex items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover mr-4 rounded"
                />
                <div>
                  <h3 className="text-md">{product.name}</h3>

                  {/* Qty Buttons */}
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          product.productId,
                          product.quantity,
                          -1
                        )
                      }
                      className="px-2 bg-gray-200 rounded"
                    >
                      -
                    </button>

                    <span>{product.quantity}</span>

                    <button
                      onClick={() =>
                        handleQuantityChange(
                          product.productId,
                          product.quantity,
                          1
                        )
                      }
                      className="px-2 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(product.productId)}
                    className="text-red-500 text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="text-xl">
                ${Number(product.price).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex justify-between items-center text-lg mb-2">
          <p>Subtotal</p>
          <p>${subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center text-lg mb-2">
          <p>Tax (8.1%)</p>
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

        <div className="text-center mt-6">
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
