import { useEffect, useState } from "react";
import { IoMdGitPullRequest } from "react-icons/io";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductDetails } from "../../redux/slices/productsSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import { Link } from "react-router-dom";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedProduct, loading, error } = useSelector(
    (state) => state.products
  );
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  //const productFetchId = productId || id;

  useEffect(() => {
    if (!id) return; // ignore early renders

    dispatch(fetchProductDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) {
        setMainImage(selectedProduct.images[0].url);
    }
  }, [selectedProduct]);

  // Quantity increment and decrement function on the + and - buttons.
  const handleQuantityChange = (action) => {
    if (action === "plus") setQuantity((prev) => prev + 1);
    if (action === "minus" && quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    setIsButtonDisabled(true);
  
    // 🟢 Always pull these directly from localStorage
    const userId = localStorage.getItem("userId");
    const guestId = localStorage.getItem("guestId");
  
    dispatch(
      addToCart({
        productId: id,
        name: selectedProduct.name,
        image: selectedProduct.images[0]?.url,
        price: selectedProduct.price,
        quantity,
  
        // 🟢 Critical logic:
        userId: userId || undefined,
        guestId: userId ? undefined : guestId,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Product added to cart!", {
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error("Add to cart failed:", err);
        toast.error("Failed to add product to cart.");
      })
      .finally(() => {
        setIsButtonDisabled(false);
      });
  };  

  if (loading) {
    return <p>Loading product details...</p>;
  }

  if (error) {
    return <p>Error loading product: {error}</p>;
  }

  return (
    <div className="p-6">
        {selectedProduct && (
            <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
                <div className="flex flex-col md:flex-row">
                    {/* Left Thumbnails */}
                    <div className="hidden md:flex flex-col space-y-4 mr-6">
                        {selectedProduct.images.map((image, index) => (
                            <img key={index} src={image.url} alt={image.altText || `Thumbnail ${index}`} className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${mainImage === image.url ? "border-black" : "border-gray-300"}`} onClick={() => setMainImage(image.url)} />
                        ))}
                    </div>
                    {/* Main Image */}
                    <div className="md:w-1/2">
                        <div className="mb-4">
                            <img src={mainImage} alt="Main Product" className="w-full h-auto object-cover rounded-lg" />
                        </div>
                    </div>
                    {/* Mobile Thumbnails */}
                    <div className="md:hidden flex overscroll-x-scroll space-x-4 mb-4">
                        {selectedProduct.images.map((image, index) => (
                            <img key={index} src={image.url} alt={image.altText || `Thumbnail ${index}`} className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${mainImage === image.url ? "border-black" : "border-gray-300"}`} onClick={() => setMainImage(image.url)} />
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="md:w-1/2 md:ml-10">
                        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                            {selectedProduct.name}
                        </h1>

                        <p className="text-lg text-gray-600 mb-1 line-through">
                            {selectedProduct.originalPrice && `${selectedProduct.originalPrice}`}
                        </p>
                        <p className="text-xl text-gray-500 mb-2">
                            $ {selectedProduct.price}
                        </p>
                        <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

                        <div className="mb-6">
                            <p className="text-gray-700">Quantity:</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <button onClick={() => handleQuantityChange("minus")} className="px-2 py-1 bg-gray-200 rounded text-lg">-</button>
                                <span className="text-lg">{quantity}</span>
                                <button onClick={() => handleQuantityChange("plus")} className="px-2 py-1 bg-gray-200 rounded text-lg">+</button>
                            </div>
                        </div>
                        {/** Add To Cart Function **/}
                        <button onClick={handleAddToCart} disabled={isButtonDisabled} className={`bg-black text-white py-2 px-6 rounded w-full mb-4 ${isButtonDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"}`}>{isButtonDisabled ? "Adding..." : "ADD TO CART"}</button>
                        {/* ✅ Continue Shopping Link */}
                        <div className="text-center mb-6">
                          <Link
                            to="/collections/all"   // or "/" if your homepage is the product listing
                            className="text-blue-500 font-semibold hover:underline"
                          >
                            ← Continue Shopping
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
                {/**<div className="mt-20">
                    <h2 className="text-3xl text-center mb-4 font-bold">You May Also Like</h2>
                    <ProductGrid products={id} loading={loading} error={error} />
                </div>**/}
            </div>
        )}
    </div>
  );
};

export default ProductDetails;