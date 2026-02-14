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

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const getCartItemKey = (item, idx) =>
  `${item.itemType || "product"}-${item.productId || item.classId || item.quiltingOrderId || idx}`;

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [checkoutId, setCheckoutId] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState({});

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zipCode: "",
    state: "",
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

  const taxableSubtotal = useMemo(() => {
    if (!cart || !cart.products) return 0;
    return cart.products.reduce((sum, item) => {
      if (item.itemType === "quilting") return sum;
      if (typeof item.taxableAmount === "number") {
        return sum + item.taxableAmount * item.quantity;
      }
      return sum + item.price * item.quantity;
    }, 0);
  }, [cart]);

  const TAX_RATE = 0.081;
  const tax = +(taxableSubtotal * TAX_RATE).toFixed(2);
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
  const handleQuantityChange = (item, delta) => {
    if (item.itemType === "quilting" || item.itemType === "class") return;
    const productId = item.productId;
    const currentQuantity = item.quantity;
    const newQty = currentQuantity + delta;
    if (newQty < 1) return;

    dispatch(
      updateCartItemQuantity({
        itemType: item.itemType || "product",
        productId,
        quiltingOrderId: item.quiltingOrderId,
        classId: item.classId,
        quantity: newQty,
      })
    );
  };

  /* ---------------------------------------------------------
   * REMOVE FROM CART INSIDE CHECKOUT
   * --------------------------------------------------------- */
  const handleRemove = (item) => {
    dispatch(
      removeFromCart({
        itemType: item.itemType || "product",
        productId: item.productId,
        quiltingOrderId: item.quiltingOrderId,
        classId: item.classId,
      })
    );
  };

  const toggleClassDetails = (item, idx) => {
    const key = getCartItemKey(item, idx);
    setExpandedClasses((prev) => ({ ...prev, [key]: !prev[key] }));
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter items-start">
      {/* ---------------- LEFT: CONTACT + SHIPPING ---------------- */}
      <div className="bg-white rounded-lg pl-20">
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
          <div className="mb-2 grid grid-cols-2 gap-4">
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
          <div className="mb-2">
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
          <div className="mb-2 grid grid-cols-2 gap-4">
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

          {/* State */}
          <div className="mb-4">
            <label className="block text-gray-700">State</label>
            <select
              required
              value={shippingAddress.state}
              onChange={(e) => {
                const selectedState = e.target.value;

                setShippingAddress({
                  ...shippingAddress,
                  state: selectedState,
                  country: selectedState ? "USA" : shippingAddress.country,
                });
              }}
              className="w-full p-2 pr-12 border rounded"
            >
              <option value="">Select State</option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}> 
                  {state.name}  {/* ------state.name if you want the name to show or state.code to show the 2 letter state abbrev. ----- */}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div className="mb-2">
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
          <div className="mb-2">
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
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
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
      <div className="bg-gray-50 mt-14 pl-2 pr-20 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>

        <div className="border-t py-4 mb-4">
          {cart.products.map((product, idx) => {
            const rowKey = getCartItemKey(product, idx);
            const classItems = Array.isArray(product.classRequiredItems)
              ? product.classRequiredItems
              : [];
            const showClassItems =
              product.itemType === "class" && classItems.length > 0 && expandedClasses[rowKey];

            return (
              <div key={rowKey} className="py-2 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <img
                      src={
                        product.image?.startsWith("/uploads")
                          ? `${import.meta.env.VITE_BACKEND_URL}${product.image}`
                          : product.image
                      }
                      alt={product.name}
                      className="w-20 h-24 object-cover mr-4 rounded"
                    />
                    <div>
                      <h3 className="text-md">{product.name}</h3>

                      {product.itemType === "quilting" || product.itemType === "class" ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500">
                            {product.itemType === "class" ? "Class enrollment" : "Quilting service"}
                          </p>
                          {product.itemType === "class" && classItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleClassDetails(product, idx)}
                              className="text-xs font-semibold text-blue-700 hover:underline"
                            >
                              {expandedClasses[rowKey] ? "Hide required items" : "Show required items"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => handleQuantityChange(product, -1)}
                            className="px-2 bg-gray-200 rounded"
                          >
                            -
                          </button>

                          <span>{product.quantity}</span>

                          <button
                            onClick={() => handleQuantityChange(product, 1)}
                            className="px-2 bg-gray-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleRemove(product)}
                        className="text-red-500 text-sm mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="text-md">${Number(product.price).toFixed(2)}</p>
                </div>

                {showClassItems && (
                  <div className="mt-3 ml-24 rounded border bg-white p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Required items (tax applies to these items only)
                    </p>
                    <div className="space-y-2">
                      {classItems.map((item, classIdx) => (
                        <div
                          key={`${item.product || item.title || "required"}-${classIdx}`}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {item.title} x {Number(item.quantity || 1)}
                          </span>
                          <span>
                            $
                            {(
                              Number(item.unitPrice || 0) * Number(item.quantity || 1)
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="flex justify-between items-center text-base mb-2">
          <p>Subtotal</p>
          <p>${subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center text-base mb-2">
          <p>Tax (8.1%)</p>
          <p>${tax.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center text-base">
          <p>Shipping</p>
          <p>Free</p>
        </div>

        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4 font-bold">
          <p>Total</p>
          <p>${grandTotal.toFixed(2)}</p>
        </div>

        <div className="text-center pb-2 mt-6">
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
