import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const csvInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`, // if admin protected
        },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete product");

      // Remove deleted product from state
      setProducts(products.filter((p) => p._id !== id));
      alert("Product deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Missing admin token. Please log in again.");
      return;
    }

    const body = new FormData();
    body.append("file", file);

    setImportingCsv(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products/import-csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "CSV import failed");

      await fetchProducts();

      const failurePreview = (data.failed || [])
        .slice(0, 5)
        .map((f) => `Row ${f.row}: ${f.reason}`)
        .join("\n");

      alert(
        `CSV import finished.\nCreated: ${data.createdCount}\nFailed: ${data.failedCount}` +
          (failurePreview ? `\n\nFirst errors:\n${failurePreview}` : "")
      );
    } catch (err) {
      alert(err.message || "CSV import failed");
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">  
            <h2 className="text-2xl font-bold mb-6">Product Management</h2>
            <div className="flex items-center gap-2">
              <a
                href="/product-import-template.csv"
                download
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition text-sm font-semibold"
              >
                Download CSV Template
              </a>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvSelected}
              />
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={importingCsv}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition disabled:opacity-60"
              >
                {importingCsv ? "Importing..." : "Upload CSV"}
              </button>
              <Link to="/admin/products/add">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Add Product
                </button>
              </Link>
            </div>
        </div>   
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="min-w-full text-left text-gray-500">
                <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                    <tr>
                        <th className="py-3 px-4">Image</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Qty</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map((product) => (
                            <tr 
                                key={product._id}
                                className="border-b hover:bg-gray-50 cursor-pointer"
                            >
                                <td className="p-4">
                                  {product.images && product.images.length > 0 ? (
                                    <img
                                      src={product.images[0]?.url} // e.g., "/images/myfile.jpg"
                                      alt={product.images[0]?.altText || product.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded">
                                      No Image
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                                    {product.name}
                                </td>
                                <td className="p-4">{product.countInStock}</td>
                                <td className="p-4">${product.price}</td>
                                <td className="p-4">{product.sku}</td>
                                <td className="p-4">
                                    <Link to={`/admin/products/${product._id}/edit`}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded mr-2 hover:bg-yellow-600">
                                        Edit
                                    </Link>
                                    <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-500">
                                No Products found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default ProductManagement;
