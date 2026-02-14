import { useState } from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { updateCartItemQuantity, removeFromCart } from "../../redux/slices/cartSlice";

const getCartItemKey = (product, index) =>
  `${product.itemType || "product"}-${
    product.productId || product.classId || product.quiltingOrderId || index
  }`;

const CartContents = () => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  const [expandedClasses, setExpandedClasses] = useState({});

  const userId = localStorage.getItem("userId");
  const guestId = localStorage.getItem("guestId");

  const handleAddToCart = (product, delta) => {
    if (product.itemType === "quilting" || product.itemType === "class") return;
    const newQuantity = Number(product.quantity || 0) + delta;
    if (newQuantity < 1) return;

    dispatch(
      updateCartItemQuantity({
        itemType: product.itemType || "product",
        productId: product.productId,
        quiltingOrderId: product.quiltingOrderId,
        classId: product.classId,
        quantity: newQuantity,
        userId: userId || undefined,
        guestId: userId ? undefined : guestId,
      })
    );
  };

  const handleRemoveFromCart = (product) => {
    dispatch(
      removeFromCart({
        itemType: product.itemType || "product",
        productId: product.productId,
        quiltingOrderId: product.quiltingOrderId,
        classId: product.classId,
        userId: userId || undefined,
        guestId: userId ? undefined : guestId,
      })
    );
  };

  const toggleClassDetails = (product, index) => {
    const key = getCartItemKey(product, index);
    setExpandedClasses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const subtotal =
    cart?.products?.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0) ||
    0;

  const taxableSubtotal =
    cart?.products?.reduce((sum, p) => {
      if (p.itemType === "quilting") return sum;
      if (typeof p.taxableAmount === "number") {
        return sum + Number(p.taxableAmount || 0) * Number(p.quantity || 0);
      }
      return sum + Number(p.price || 0) * Number(p.quantity || 0);
    }, 0) || 0;

  const taxRate = 0.081;
  const taxAmount = taxableSubtotal * taxRate;
  const grandTotal = subtotal + taxAmount;
  const validProducts = cart?.products?.filter((p) => Number(p.quantity) > 0) || [];

  return (
    <div>
      {validProducts.length > 0 ? (
        <>
          <div>
            {validProducts.map((product, index) => {
              const classRowKey = getCartItemKey(product, index);
              const classItems = Array.isArray(product.classRequiredItems)
                ? product.classRequiredItems
                : [];
              const showClassDetails =
                product.itemType === "class" && classItems.length > 0 && expandedClasses[classRowKey];

              return (
                <div key={classRowKey} className="py-4 border-b">
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
                        <h3>{product.name}</h3>

                        {product.itemType === "quilting" || product.itemType === "class" ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500">
                              {product.itemType === "class" ? "Class enrollment" : "Quilting service"}
                            </p>
                            {product.itemType === "class" && classItems.length > 0 && (
                              <button
                                onClick={() => toggleClassDetails(product, index)}
                                className="text-xs font-semibold text-blue-700 hover:underline"
                              >
                                {expandedClasses[classRowKey]
                                  ? "Hide required items"
                                  : "Show required items"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center mt-2">
                            <button
                              onClick={() => handleAddToCart(product, -1)}
                              className="border rounded px-2 py-1 text-xl font-medium"
                            >
                              -
                            </button>

                            <span className="mx-4">{product.quantity}</span>

                            <button
                              onClick={() => handleAddToCart(product, 1)}
                              className="border rounded px-2 py-1 text-xl font-medium"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">${Number(product.price || 0).toFixed(2)} each</p>
                      <p className="font-medium">
                        ${(Number(product.price || 0) * Number(product.quantity || 0)).toFixed(2)}
                      </p>
                      <button onClick={() => handleRemoveFromCart(product)}>
                        <RiDeleteBin3Line className="h-6 w-6 mt-2 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {showClassDetails && (
                    <div className="mt-3 ml-24 rounded border bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Required items (tax applies to these items only)
                      </p>
                      <div className="space-y-2">
                        {classItems.map((item, idx) => (
                          <div
                            key={`${item.product || item.title || "required"}-${idx}`}
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
};

export default CartContents;
