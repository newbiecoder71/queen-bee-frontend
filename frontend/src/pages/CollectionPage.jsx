import { useEffect, useMemo, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productsSlice";

const CollectionPage = () => {
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  const sidebarRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSearch = searchParams.get("search");

  const filters = useMemo(() => {
    const baseFilters = Object.fromEntries([...searchParams]);
    if (collection) baseFilters.collection = collection;
    return baseFilters;
  }, [searchParams, collection]);

  useEffect(() => {
    dispatch(fetchProductsByFilters(filters));
  }, [dispatch, filters]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // ✅ Close sidebar when clicking outside, but only on small screens
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        isSidebarOpen &&
        window.innerWidth < 1024 && // only apply below "lg"
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Mobile Filter button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden border p-2 flex justify-center items-center"
      >
        <FaFilter className="mr-2" /> Filters
      </button>

      {/* Filter Sidebar */}
      <div
        ref={sidebarRef}
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 z-50 left-0 w-64 bg-white 
        overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0`}
      >
        <FilterSidebar />
      </div>

      <div className="flex-grow p-4">
        <Link to="/collections/all">
          <h2 className="text-2xl uppercase mb-4">All Collections</h2>
        </Link>
        {activeSearch && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border bg-gray-50 px-3 py-2">
            <p className="text-sm text-gray-700">
              Showing results for: <span className="font-semibold">"{activeSearch}"</span>
            </p>
            <Link
              to="/collections/all"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Back to all collections
            </Link>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex justify-end mb-4 mr-3">
          <div className="flex items-center gap-4">
            <span className="text-md text-gray-700 mb-4">Sorted by</span>
            <SortOptions />
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid products={products} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default CollectionPage;
