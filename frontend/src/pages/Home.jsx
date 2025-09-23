import Hero from "../components/Layout/Hero";
import FeaturesSection from "../components/Products/FeaturesSection";
import FeaturedCollection from "../components/Products/FeaturedCollection";
import GenderCollectionSection from "../components/Products/GenderCollectionSection";
import NewArrivals from "../components/Products/NewArrivals";
import ProductDetails from "../components/Products/ProductDetails";
import ProductGrid from "../components/Products/ProductGrid";
import { useDispatch } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productsSlice";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const Home = () => {
    const dispatch = useDispatch();
    const {products, loading, error} = useSelector((state) => state.products);
    const [bestSellerProduct, setBestSellerProduct] = useState([]);

    useEffect(() => {
        // Fetch products for a specific collection
        dispatch(
            fetchProductsByFilters({
                theme: "Acorn Hollow",
                category: "Fabric",
                limit: 8,
            })
        );
        // Fetch best seller products
        const fetchBestSeller = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`
                );
                setBestSellerProduct(response.data);
            } catch (error) {
                console.error("Error fetching best seller products:", error);
            }
        };
        fetchBestSeller();
    }, [dispatch]);
    
  return (
    <div>
        <Hero />
        {/*<GenderCollectionSection />*/}
        <NewArrivals />

        {/* Best Seller */}
        <h2 className="text-3xl text-center font-bold mb-4">   </h2>
        {bestSellerProduct ? (<ProductDetails productId={bestSellerProduct._id} />) : (
            <p className="text-center">Loading best seller product...</p>
        )}

        <div className="container mx-auto">
            <h2 className="text-3xl text-center font-bold mb-4">Favorite Products</h2>
            <ProductGrid products={products} loading={loading} error={error} />
        </div>
        {/*<FeaturedCollection />*/}
        <FeaturesSection />
    </div>
  );
};

export default Home;