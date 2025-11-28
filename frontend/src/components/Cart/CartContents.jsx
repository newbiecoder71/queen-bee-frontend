import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import { updateCartItemQuantity, removeFromCart } from "../../redux/slices/cartSlice";

const CartContents = ({ cart, userId, guestId }) => {
  const dispatch = useDispatch();

  // Handle adding to or subtracting from the cart

  const handleAddToCart = (productId, delta, quantity) => {
    const newQuantity = quantity + delta;
  
    if (newQuantity >= 1) {
      const userIdLS = localStorage.getItem("userId");
      const guestIdLS = localStorage.getItem("guestId");
  
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: newQuantity,
  
          // SAME LOGIC AS PRODUCT DETAILS
          userId: userIdLS || undefined,
          guestId: userIdLS ? undefined : guestIdLS,
        })
      );
    }
  };  

  const handleRemoveFromCart = (productId) => {
    dispatch(
      removeFromCart({
        productId,
        userId: localStorage.getItem("userId") || undefined,
        guestId: localStorage.getItem("userId") ? undefined : localStorage.getItem("guestId"),
      })
    );    
  }
  // --- subtotal + tax calculations ---
  const subtotal =
  cart?.products?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0;
  const taxRate = 0.081; // 8.1% tax
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;


  return (
    <div>
    {Array.isArray(cart?.products) && cart.products.filter(p => p.quantity > 0).length > 0 ? (
      <>
        {/* Products list */}
        <div>
          {cart.products
            .filter(product => product.quantity > 0)
            .map((product, index) => (
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
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() =>
                          handleAddToCart(product.productId, -1, product.quantity)
                        }
                        className="border rounded px-2 py-1 text-xl font-medium"
                      >
                        -
                      </button>
                      <span className="mx-4">{product.quantity}</span>
                      <button
                        onClick={() =>
                          handleAddToCart(product.productId, 1, product.quantity)
                        }
                        className="border rounded px-2 py-1 text-xl font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {/* Price per item */}
                  <p className="text-sm text-gray-500">
                    ${product.price.toLocaleString()} each
                  </p>
                  {/* Total for this product */}
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

        {/* Subtotal block fixed at bottom */}
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
      <p className="text-center text-gray-500 py-4">Your cart is empty.</p>
    )}
    </div>
  );
}


export default CartContents;