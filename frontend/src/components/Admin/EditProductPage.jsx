import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditProductPage = () => {
  const { id } = useParams(); // product ID from URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`
        );
        setProductData({
          name: res.data.name || "",
          description: res.data.description || "",
          price: res.data.price || 0,
          discountPrice: res.data.discountPrice || 0,
          countInStock: res.data.countInStock || 0,
          sku: res.data.sku || "",
          category: res.data.category || "",
          brand: res.data.brand || "",
          theme: res.data.theme || "",
          collections: res.data.collections || "",
          material: res.data.material || "",
          images: res.data.images || [],
          isFeatured: res.data.isFeatured || false,
          isPublished: res.data.isPublished || false,
          rating: res.data.rating || 0,
          numReviews: res.data.numReviews || 0,
          tags: res.data.tags || [],
          metaTitle: res.data.metaTitle || "",
          metaDescription: res.data.metaDescription || "",
          metaKeywords: res.data.metaKeywords || "",
          dimensions: res.data.dimensions || { length: 0, width: 0, height: 0 },
          weight: res.data.weight || 0,
        });
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch product");
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCancel = () => {
  if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
    navigate("/admin/products"); // <-- this redirects back to the Product Management page
  }
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    console.log(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      navigate("/admin/products"); // redirect back after save
    } catch (err) {
      console.error(err);
      setError("Failed to update product");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-6">Edit Product</h2>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={productData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            required
          />
        </div>

        {/* Price */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Price</label>
          <input
            type="number"
            name="price"
            value={productData.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Count In Stock */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Count In Stock</label>
          <input
            type="number"
            name="countInStock"
            value={productData.countInStock}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* SKU */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            value={productData.sku}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        
        {/* Category */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Category</label>
          <input
            type="text"
            name="category"
            value={productData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Material */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Material</label>
          <input
            type="text"
            name="material"
            value={productData.material || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Brand */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Brand</label>
          <input
            type="text"
            name="brand"
            value={productData.brand}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Theme */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Theme</label>
          <input
            type="text"
            name="theme"
            value={productData.theme || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Collections */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Collections</label>
          <input
            type="text"
            name="collections"
            value={productData.collections || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Meta Title */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Meta Title</label>
          <input
            type="text"
            name="metaTitle"
            value={productData.metaTitle || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Meta Description */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Meta Description</label>
          <textarea
            name="metaDescription"
            value={productData.metaDescription || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={3}
          />
        </div>

        {/* Meta Keywords */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Meta Keywords</label>
          <input
            type="text"
            name="metaKeywords"
            value={productData.metaKeywords || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Dimensions */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-2">Length</label>
            <input
              type="number"
              name="length"
              value={productData.dimensions?.length || 0}
              onChange={(e) =>
                setProductData((prev) => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, length: Number(e.target.value) },
                }))
              }
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Width</label>
            <input
              type="number"
              name="width"
              value={productData.dimensions?.width || 0}
              onChange={(e) =>
                setProductData((prev) => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, width: Number(e.target.value) },
                }))
              }
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Height</label>
            <input
              type="number"
              name="height"
              value={productData.dimensions?.height || 0}
              onChange={(e) =>
                setProductData((prev) => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, height: Number(e.target.value) },
                }))
              }
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        {/* Weight */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Weight</label>
          <input
            type="number"
            name="weight"
            value={productData.weight || 0}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Tags (comma-separated example) */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={productData.tags.join(", ")}
            onChange={(e) =>
              setProductData((prev) => ({
                ...prev,
                tags: e.target.value.split(",").map((t) => t.trim()),
              }))
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Image Uploads */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Upload Image</label>
          <input type="file" onChange={handleImageUpload} />
          <div className="flex gap-4 mt-4">
            {productData.images &&
              productData.images.map((image, index) => (
                <div key={index}>
                  <img
                    src={image.url}
                    alt={image.altText || "Product Image"}
                    className="w-20 h-20 object-cover rounded-md shadow-md"
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          {/* Update button */}
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Update
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;
