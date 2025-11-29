import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import {
  updateCartItemQuantity,
  removeFromCart,
} from "../../redux/slices/cartSlice";

const CartContents = () => {
  const dispatch = useDispatch();

  // Pull cart from Redux store
  const { cart } = useSelector((state) => state.cart);

  // Pull identity from localStorage
  const userId = localStorage.getItem("userId");
  const guestId = localStorage.getItem("guestId");

  /* -----------------------------------------
      HANDLE QUANTITY CHANGES
  ----------------------------------------- */
  const handleAddToCart = (productId, delta, quantity) => {
    const newQuantity = quantity + delta;

    if (newQuantity < 1) return;

    dispatch(
      updateCartItemQuantity({
        productId,
        quantity: newQuantity,

        // critical logic applied everywhere
        userId: userId || undefined,
        guestId: userId ? undefined : guestId,
      })
    );
  };

  /* -----------------------------------------
      REMOVE ITEM
  ----------------------------------------- */
  const handleRemoveFromCart = (productId) => {
    dispatch(
      removeFromCart({
        productId,

        userId: userId || undefined,
        guestId: userId ? undefined : guestId,
      })
    );
  };

  /* -----------------------------------------
      CART TOTALS
  ----------------------------------------- */
  const subtotal =
    cart?.products?.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    ) || 0;

  const taxRate = 0.081;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const validProducts = cart?.products?.filter((p) => p.quantity > 0) || [];

  return (
    <div>
      {validProducts.length > 0 ? (
        <>
          {/* Product List */}
          <div>
            {validProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-start justify-between py-4 border-b"
              >
                <div className="flex items-start">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-24 object-cover mr-4 rounded"
                  />
                  <div>
                    <h3>{product.name}</h3>

                    {/* Quantity Controls */}
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() =>
                          handleAddToCart(
                            product.productId,
                            -1,
                            product.quantity
                          )
                        }
                        className="border rounded px-2 py-1 text-xl font-medium"
                      >
                        -
                      </button>

                      <span className="mx-4">{product.quantity}</span>

                      <button
                        onClick={() =>
                          handleAddToCart(
                            product.productId,
                            1,
                            product.quantity
                          )
                        }
                        className="border rounded px-2 py-1 text-xl font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price + Remove */}
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    ${product.price.toLocaleString()} each
                  </p>

                  <p className="font-medium">
                    ${(product.price * product.quantity).toFixed(2)}
                  </p>

                  <button onClick={() => handleRemoveFromCart(product.productId)}>
                    <RiDeleteBin3Line className="h-6 w-6 mt-2 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Tax (8.1%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 py-4">
          Your cart is empty.
        </p>
      )}
    </div>
  );
};

export default CartContents;
