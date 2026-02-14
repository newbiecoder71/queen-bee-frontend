const ProductForm = ({
  title,
  error,
  productData,
  setProductData,
  onSubmit,
  onCancel,
  onClear,
  submitLabel = "Submit",
  showClear = false,
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDimensionChange = (name, value) => {
    setProductData((prev) => ({
      ...prev,
      dimensions: { ...(prev.dimensions || {}), [name]: value },
    }));
  };

  const handleImageChange = (index, field, value) => {
    setProductData((prev) => ({
      ...prev,
      images: (prev.images || []).map((img, i) => (i === index ? { ...img, [field]: value } : img)),
    }));
  };

  const addImageRow = () => {
    setProductData((prev) => ({
      ...prev,
      images: [...(prev.images || []), { url: "", altText: "" }],
    }));
  };

  const removeImageRow = (index) => {
    setProductData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={onSubmit}>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-2">Price</label>
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Discount Price</label>
            <input
              type="number"
              name="discountPrice"
              value={productData.discountPrice}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Count In Stock</label>
            <input
              type="number"
              name="countInStock"
              value={productData.countInStock}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-2">SKU</label>
            <input
              type="text"
              name="sku"
              value={productData.sku}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={productData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-2">Brand</label>
            <input
              type="text"
              name="brand"
              value={productData.brand}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Theme</label>
            <input
              type="text"
              name="theme"
              value={productData.theme}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Collections</label>
            <input
              type="text"
              name="collections"
              value={productData.collections}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Material</label>
            <input
              type="text"
              name="material"
              value={productData.material}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div className="mb-6 rounded border p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block font-semibold">Image URLs</label>
            <button
              type="button"
              onClick={addImageRow}
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
            >
              Add Image URL
            </button>
          </div>

          <div className="space-y-3">
            {(productData.images || []).map((image, index) => (
              <div key={`image-row-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={image.url || ""}
                  onChange={(e) => handleImageChange(index, "url", e.target.value)}
                  placeholder="/images/my-image.jpg or https://..."
                  className="md:col-span-7 border border-gray-300 rounded-md p-2"
                />
                <input
                  type="text"
                  value={image.altText || ""}
                  onChange={(e) => handleImageChange(index, "altText", e.target.value)}
                  placeholder="Alt text"
                  className="md:col-span-4 border border-gray-300 rounded-md p-2"
                />
                <button
                  type="button"
                  onClick={() => removeImageRow(index)}
                  disabled={(productData.images || []).length === 1}
                  className="md:col-span-1 bg-red-100 text-red-700 px-2 rounded disabled:opacity-40"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded border p-4">
          <h3 className="font-semibold mb-3">Additional Fields</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={productData.tags}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Weight</label>
              <input
                type="number"
                name="weight"
                value={productData.weight}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Length</label>
              <input
                type="number"
                value={productData.dimensions?.length || 0}
                onChange={(e) => handleDimensionChange("length", e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Width</label>
              <input
                type="number"
                value={productData.dimensions?.width || 0}
                onChange={(e) => handleDimensionChange("width", e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Height</label>
              <input
                type="number"
                value={productData.dimensions?.height || 0}
                onChange={(e) => handleDimensionChange("height", e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Meta Title</label>
            <input
              type="text"
              name="metaTitle"
              value={productData.metaTitle}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Meta Description</label>
            <textarea
              name="metaDescription"
              value={productData.metaDescription}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Meta Keywords</label>
            <input
              type="text"
              name="metaKeywords"
              value={productData.metaKeywords}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={productData.isFeatured}
                onChange={handleChange}
              />
              <span>Featured</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="isPublished"
                checked={productData.isPublished}
                onChange={handleChange}
              />
              <span>Published</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            {submitLabel}
          </button>

          {showClear && (
            <button
              type="button"
              onClick={onClear}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
