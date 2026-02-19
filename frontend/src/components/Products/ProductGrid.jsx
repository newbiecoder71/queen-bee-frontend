import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import { toast } from "sonner";
import {
  addToWishlist,
  fetchWishlist,
  removeFromWishlist,
} from "../../redux/slices/wishlistSlice";

const ProductGrid = ({ products, loading, error }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { items: wishlistItems, hasLoaded } = useSelector((state) => state.wishlist);

    useEffect(() => {
        if (!user || hasLoaded) return;
        dispatch(fetchWishlist());
    }, [dispatch, user, hasLoaded]);

    const wishlistIds = new Set(wishlistItems.map((item) => item._id));
    const shouldContainImage = (name = "") => /baby\s*elegan/i.test(String(name));
    const getSaleInfo = (product) => {
        const regular = Number(product?.price || 0);
        const sale = Number(product?.discountPrice || 0);
        const onSale = Number.isFinite(sale) && sale > 0 && sale < regular;
        return { regular, sale, onSale };
    };

    const handleWishlistClick = async (e, productId, isWishlisted) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
            return;
        }

        try {
            if (isWishlisted) {
                await dispatch(removeFromWishlist(productId)).unwrap();
                toast.success("Removed from favorites");
            } else {
                await dispatch(addToWishlist(productId)).unwrap();
                toast.success("Added to favorites");
            }
        } catch (err) {
            toast.error(err || "Could not update favorites");
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }
    if (error) {
        return <p>Error: {error}</p>;
    }
    
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
            <div key={product._id} className="relative">
                {getSaleInfo(product).onSale && (
                    <div className="absolute left-3 top-3 z-10 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                        On Sale
                    </div>
                )}
                <button
                    type="button"
                    onClick={(e) =>
                        handleWishlistClick(e, product._id, wishlistIds.has(product._id))
                    }
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                    aria-label={wishlistIds.has(product._id) ? "Remove from favorites" : "Add to favorites"}
                >
                    {wishlistIds.has(product._id) ? (
                        <HiHeart className="h-5 w-5 text-red-500" />
                    ) : (
                        <HiOutlineHeart className="h-5 w-5 text-gray-700" />
                    )}
                </button>
                <Link to={`/product/${product._id}`} className="block">
                <div className="bg-white p-4 rounded-lg">
                    <div className="w-full h-96 mb-4">
                        {product.images?.[0]?.url ? (
                            <img
                                src={product.images[0].url}
                                alt={product.images[0].altText || product.name}
                                className={`w-full h-full rounded-lg ${
                                  shouldContainImage(product.name)
                                    ? "object-contain bg-white"
                                    : "object-cover"
                                }`}
                            />
                        ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
                            No image available
                        </div>
                        )}

                    </div>
                    <h3 className="text-sm mb-2">{product.name}</h3>
                    {(() => {
                        const { regular, sale, onSale } = getSaleInfo(product);
                        if (onSale) {
                            return (
                                <div className="text-sm tracking-tight">
                                    <p className="text-gray-400 line-through">${regular.toFixed(2)}</p>
                                    <p className="font-semibold text-red-600">On Sale ${sale.toFixed(2)}</p>
                                </div>
                            );
                        }
                        return <p className="text-gray-500 font-medium">${regular.toFixed(2)}</p>;
                    })()}
                </div>
                </Link>
            </div>
        ))}
    </div>
  );
};

export default ProductGrid;
