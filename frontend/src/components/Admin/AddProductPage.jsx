import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProductForm from "./ProductForm";

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  discountPrice: 0,
  countInStock: 0,
  sku: "",
  category: "",
  brand: "",
  theme: "",
  collections: "",
  material: "",
  images: [{ url: "", altText: "" }],
  isFeatured: false,
  isPublished: false,
  tags: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  dimensions: { length: 0, width: 0, height: 0 },
  weight: 0,
};

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

const AddProductPage = () => {
  const navigate = useNavigate();
  const [productData, setProductData] = useState(emptyProduct);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/products`,
        normalizePayload(productData),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      alert("Product added successfully!");
      navigate("/admin/products");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleClear = () => {
    setProductData(emptyProduct);
    setError(null);
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  return (
    <ProductForm
      title="Add New Product"
      error={error}
      productData={productData}
      setProductData={setProductData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onClear={handleClear}
      submitLabel="Submit"
      showClear
    />
  );
};

export default AddProductPage;
