import { useState } from "react";
import { HiMagnifyingGlass, HiMiniXMark } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFilters, fetchProductsByFilters } from "../../redux/slices/productsSlice";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const filters = useSelector((state) => state.products.filters);

  const handleSearchToggle = () => setIsOpen(!isOpen);

  const handleSearch = (e) => {
    e.preventDefault();

    const updatedFilters = { ...filters, search: searchTerm };
    dispatch(setFilters(updatedFilters));
    dispatch(fetchProductsByFilters(updatedFilters));

    // Build URL with all filters
    const params = new URLSearchParams();
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key];
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      } else if (value) {
        params.set(key, value);
      }
    });

    navigate(`/collections/all?${params.toString()}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    const updatedFilters = { ...filters, search: "" };
    setSearchTerm("");
    dispatch(setFilters(updatedFilters));
    dispatch(fetchProductsByFilters(updatedFilters));

    // Build URL without search
    const params = new URLSearchParams();
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key];
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      } else if (value) {
        params.set(key, value);
      }
    });

    navigate(`/collections/all?${params.toString()}`);
  };

  return (
    <div
      className={`flex items-center justify-center w-full transition-all duration-300 ${
        isOpen ? "absolute top-0 left-0 w-full bg-white h-24 z-50" : "w-auto"
      }`}
    >
      {isOpen ? (
        <form
          onSubmit={handleSearch}
          className="relative flex items-center justify-center w-full"
        >
          <div className="relative w-1/2 flex items-center">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-100 px-4 py-2 pl-2 pr-20 rounded-lg focus:outline-none w-full placeholder:text-gray-700"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            >
              <HiMagnifyingGlass className="h-6 w-6" />
            </button>
          </div>
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            onClick={handleSearchToggle}
          >
            <HiMiniXMark className="h-6 w-6" />
          </button>
        </form>
      ) : (
        <button onClick={handleSearchToggle}>
          <HiMagnifyingGlass className="h-7 w-7" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;