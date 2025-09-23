import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchProductsByFilters } from "../../redux/slices/productsSlice";

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [filters, setFilters] = useState({
    category: "",
    material: [],
    theme: [],
    brand: [],
    minPrice: 0,
    maxPrice: 100,
    search: searchParams.get("search") || "", // ✅ keep search term
  });

  const [priceRange, setPriceRange] = useState([0, 100]);

  const categories = ["Fabric", "Notions", "Patterns", "Books", "Kits"];
  const materials = ["Cotton", "Wool", "Denim", "Silk", "Linen", "Viscose", "Fleece"];
  const themes = ["Easter", "Spring", "Summer", "Autumn", "Winter", "Halloween", "Christmas", "Floral"];
  const brands = ["Moda Fabrics", "Henry Glass", "Riley Blake", "Art Gallery", "Robert Kaufman", "Free Spirit", "Michael Miller"];

  // ✅ Sync filters from URL on load
  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    setFilters({
      category: params.category || "",
      material: params.material ? params.material.split(",") : [],
      theme: params.theme ? params.theme.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: params.minPrice ? Number(params.minPrice) : 0,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : 100,
      search: params.search || "", // ✅ preserve search query
    });
    setPriceRange([
      params.minPrice ? Number(params.minPrice) : 0,
      params.maxPrice ? Number(params.maxPrice) : 100,
    ]);
  }, [searchParams]);

  // ✅ Keep filters + query string + dispatch to backend
  const updateFilters = (newFilters) => {
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((key) => {
      if (Array.isArray(newFilters[key]) && newFilters[key].length > 0) {
        params.set(key, newFilters[key].join(","));
      } else if (
        newFilters[key] !== "" &&
        newFilters[key] !== null &&
        newFilters[key] !== undefined
      ) {
        params.set(key, newFilters[key]);
      }
    });

    setSearchParams(params);
    navigate(`?${params.toString()}`);

    // ✅ Make sure backend always gets updated filters
    dispatch(fetchProductsByFilters(newFilters));
  };

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    let newFilters = { ...filters };

    if (type === "checkbox") {
      if (!Array.isArray(newFilters[name])) newFilters[name] = [];
      if (checked) {
        newFilters[name] = [...newFilters[name], value];
      } else {
        newFilters[name] = newFilters[name].filter((v) => v !== value);
      }
    } else if (type === "radio") {
      newFilters[name] = value;
    }

    updateFilters(newFilters);
  };

  const handlePriceChange = (e) => {
    const newMaxPrice = Number(e.target.value);
    const newFilters = { ...filters, minPrice: 0, maxPrice: newMaxPrice };
    setPriceRange([0, newMaxPrice]);
    updateFilters(newFilters);
  };

  return (
    <div className="p-4">
      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Category</label>
        {categories.map((cat) => (
          <div key={cat} className="flex items-center mb-1">
            <input
              type="radio"
              name="category"
              value={cat}
              onChange={handleFilterChange}
              checked={filters.category === cat}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{cat}</span>
          </div>
        ))}
      </div>

      {/* Material Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Material</label>
        {materials.map((mat) => (
          <div key={mat} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="material"
              value={mat}
              onChange={handleFilterChange}
              checked={filters.material.includes(mat)}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{mat}</span>
          </div>
        ))}
      </div>

      {/* Theme Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Theme</label>
        {themes.map((theme) => (
          <div key={theme} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="theme"
              value={theme}
              onChange={handleFilterChange}
              checked={filters.theme.includes(theme)}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{theme}</span>
          </div>
        ))}
      </div>

      {/* Brand Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Brand</label>
        {brands.map((b) => (
          <div key={b} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="brand"
              value={b}
              onChange={handleFilterChange}
              checked={filters.brand.includes(b)}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{b}</span>
          </div>
        ))}
      </div>

      {/* Price Filter */}
      <div className="mb-8">
        <label className="block text-gray-600 font-medium mb-2">Price Range</label>
        <input
          type="range"
          name="priceRange"
          min={0}
          max={100}
          value={priceRange[1]}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-gray-600 mt-2">
          <span>$0</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;