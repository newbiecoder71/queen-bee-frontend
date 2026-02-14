import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ProductForm from "./ProductForm";

const normalizePayload = (productData) => ({
  ...productData,
  price: Number(productData.price || 0),
  discountPrice: Number(productData.discountPrice || 0),
  countInStock: Number(productData.countInStock || 0),
  weight: Number(productData.weight || 0),
  dimensions: {
    length: Number(productData.dimensions?.length || 0),
    width: Number(productData.dimensions?.width || 0),
    height: Number(productData.dimensions?.height || 0),
  },
  tags: String(productData.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  images: (productData.images || [])
    .map((img) => ({
      url: String(img.url || "").trim(),
      altText: String(img.altText || "").trim(),
    }))
    .filter((img) => img.url),
});

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`);
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
          images:
            Array.isArray(res.data.images) && res.data.images.length
              ? res.data.images
              : [{ url: "", altText: "" }],
          isFeatured: !!res.data.isFeatured,
          isPublished: !!res.data.isPublished,
          tags: Array.isArray(res.data.tags) ? res.data.tags.join(", ") : "",
          metaTitle: res.data.metaTitle || "",
          metaDescription: res.data.metaDescription || "",
          metaKeywords: res.data.metaKeywords || "",
          dimensions: {
            length: res.data.dimensions?.length || 0,
            width: res.data.dimensions?.width || 0,
            height: res.data.dimensions?.height || 0,
          },
          weight: res.data.weight || 0,
        });
      } catch (fetchErr) {
        console.error(fetchErr);
        setError("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
      navigate("/admin/products");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}`,
        normalizePayload(productData),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      navigate("/admin/products");
    } catch (submitErr) {
      console.error(submitErr);
      setError("Failed to update product");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error && !productData) return <p className="text-red-500">{error}</p>;
  if (!productData) return <p className="text-red-500">Product not found.</p>;

  return (
    <ProductForm
      title="Edit Product"
      error={error}
      productData={productData}
      setProductData={setProductData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Update"
    />
  );
};

export default EditProductPage;
