import { IoMdClose } from "react-icons/io";
import CartContents from "../Cart/CartContents";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ErrorBoundary from "../ErrorBoundary";

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const navigate = useNavigate();

  // Pull from Redux
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const handleCheckout = () => {
    toggleCartDrawer();
    navigate("/checkout");
  };

  const handleSignInCheckout = () => {
    toggleCartDrawer();
    navigate("/login?redirect=checkout");
  };

  const hasItems =
    cart?.products?.filter((p) => p.quantity > 0).length > 0;

  return (
    <>
      <button
        type="button"
        aria-label="Close cart"
        onClick={toggleCartDrawer}
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-40 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-[30rem] h-full bg-white rounded-l-2xl border-l border-gray-200 shadow-2xl transform transition-transform duration-300 flex flex-col z-50 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button onClick={toggleCartDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Cart Contents Scrollable */}
        <div className="flex-grow p-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Your Cart</h2>

          <ErrorBoundary>
            {hasItems ? (
              <CartContents />
            ) : (
              <p className="text-gray-500">Your cart is empty.</p>
            )}
          </ErrorBoundary>
        </div>

        {/* Checkout Button */}
        <div className="p-4 bg-white sticky bottom-0">
          {hasItems && (
            <>
              {user ? (
                <button
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Checkout
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                  >
                    Continue as Guest
                  </button>
                  <button
                    onClick={handleSignInCheckout}
                    className="w-full border border-gray-300 bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Sign In for Faster Checkout
                  </button>
                </div>
              )}

              <p className="text-sm tracking-tighter text-gray-500 mt-2 text-center">
                Shipping, taxes, and discount codes calculated at checkout.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
