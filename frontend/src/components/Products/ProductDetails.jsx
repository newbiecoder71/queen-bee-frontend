import { useEffect, useState } from "react";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import { toast } from "sonner";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductDetails } from "../../redux/slices/productsSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import {
  addToWishlist,
  fetchWishlist,
  removeFromWishlist,
} from "../../redux/slices/wishlistSlice";

const ProductDetails = ({ productId }) => {
  const { id: routeId } = useParams();
  const id = productId || routeId;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProduct, loading, error } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems, hasLoaded } = useSelector((state) => state.wishlist);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const shouldContainImage = (name = "") => /baby\s*elegan/i.test(String(name));
  const getSaleInfo = (product) => {
    const regular = Number(product?.price || 0);
    const sale = Number(product?.discountPrice || 0);
    const onSale = Number.isFinite(sale) && sale > 0 && sale < regular;
    return { regular, sale, onSale };
  };

  useEffect(() => {
    if (!id) return;
    dispatch(fetchProductDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) {
      setMainImage(selectedProduct.images[0].url);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!user || hasLoaded) return;
    dispatch(fetchWishlist());
  }, [dispatch, user, hasLoaded]);

  const handleQuantityChange = (action) => {
    if (action === "plus") setQuantity((prev) => prev + 1);
    if (action === "minus" && quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    setIsButtonDisabled(true);
    const { regular, sale, onSale } = getSaleInfo(selectedProduct);
    const effectivePrice = onSale ? sale : regular;

    const userId = localStorage.getItem("userId");
    const guestId = localStorage.getItem("guestId");

    dispatch(
      addToCart({
        productId: id,
        name: selectedProduct.name,
        image: selectedProduct.images[0]?.url,
        price: effectivePrice,
        quantity,
        userId: userId || undefined,
        guestId: userId ? undefined : guestId,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Product added to cart!", { duration: 2000 });
      })
      .catch((err) => {
        console.error("Add to cart failed:", err);
        toast.error("Failed to add product to cart.");
      })
      .finally(() => {
        setIsButtonDisabled(false);
      });
  };

  const isWishlisted = wishlistItems.some((item) => item._id === id);

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(id)).unwrap();
        toast.success("Removed from favorites");
      } else {
        await dispatch(addToWishlist(id)).unwrap();
        toast.success("Added to favorites");
      }
    } catch (err) {
      toast.error(err || "Could not update favorites");
    }
  };

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p>Error loading product: {error}</p>;

  return (
    <div className="p-6">
      {selectedProduct && (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
          <div className="flex flex-col md:flex-row">
            <div className="hidden md:flex flex-col space-y-4 mr-6">
              {selectedProduct.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index}`}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${mainImage === image.url ? "border-black" : "border-gray-300"}`}
                  onClick={() => setMainImage(image.url)}
                />
              ))}
            </div>

            <div className="md:w-1/2">
              <div className="mb-4">
                <img
                  src={mainImage}
                  alt="Main Product"
                  className={`w-full h-auto rounded-lg ${
                    shouldContainImage(selectedProduct?.name) ? "object-contain bg-white" : "object-cover"
                  }`}
                />
              </div>
            </div>

            <div className="md:hidden flex overscroll-x-scroll space-x-4 mb-4">
              {selectedProduct.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index}`}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${mainImage === image.url ? "border-black" : "border-gray-300"}`}
                  onClick={() => setMainImage(image.url)}
                />
              ))}
            </div>

            <div className="md:w-1/2 md:ml-10">
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">{selectedProduct.name}</h1>

              {(() => {
                const { regular, sale, onSale } = getSaleInfo(selectedProduct);
                if (onSale) {
                  return (
                    <>
                      <p className="text-lg text-gray-600 mb-1 line-through">${regular.toFixed(2)}</p>
                      <p className="text-2xl text-red-600 font-semibold mb-2">On Sale ${sale.toFixed(2)}</p>
                    </>
                  );
                }
                return <p className="text-xl text-gray-500 mb-2">${regular.toFixed(2)}</p>;
              })()}
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

              <div className="mb-6">
                <p className="text-gray-700">Quantity:</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button onClick={() => handleQuantityChange("minus")} className="px-2 py-1 bg-gray-200 rounded text-lg">-</button>
                  <span className="text-lg">{quantity}</span>
                  <button onClick={() => handleQuantityChange("plus")} className="px-2 py-1 bg-gray-200 rounded text-lg">+</button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isButtonDisabled}
                className={`bg-black text-white py-2 px-6 rounded w-full mb-4 ${isButtonDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"}`}
              >
                {isButtonDisabled ? "Adding..." : "ADD TO CART"}
              </button>

              <button
                onClick={handleToggleWishlist}
                className="w-full mb-4 inline-flex items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 px-6 font-semibold hover:bg-gray-50"
              >
                {isWishlisted ? (
                  <HiHeart className="h-5 w-5 text-red-500" />
                ) : (
                  <HiOutlineHeart className="h-5 w-5 text-gray-700" />
                )}
                {isWishlisted ? "Remove from Favorites" : "Add to Favorites"}
              </button>

              <div className="text-center mb-6">
                <Link to="/collections/all" className="text-blue-500 font-semibold hover:underline">
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-10 text-gray-700">
                <h3 className="text-xl font-bold mb-4">Characteristics:</h3>
                <table className="w-full text-left text-sm text-gray-600">
                  <tbody>
                    <tr>
                      <td className="py-1">Brand</td>
                      <td className="py-1">{selectedProduct.brand}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Material</td>
                      <td className="py-1">{selectedProduct.material}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
