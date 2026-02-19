import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExporting, setHistoryExporting] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyProductId, setHistoryProductId] = useState("");
  const [historyProductName, setHistoryProductName] = useState("");
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyFilters, setHistoryFilters] = useState({
    eventType: "",
    source: "",
    dateFrom: "",
    dateTo: "",
  });
  const csvInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete product");

      setProducts((prev) => prev.filter((p) => p._id !== id));
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

  const openHistory = async (product) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Missing admin token. Please log in again.");
      return;
    }

    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryProductId(product?._id || "");
    setHistoryProductName(product?.name || "Product");
    setHistoryEvents([]);
    setHistoryPage(1);
    setHistoryTotalPages(1);
    setHistoryTotalCount(0);
    const defaultFilters = {
      eventType: "",
      source: "",
      dateFrom: "",
      dateTo: "",
    };
    setHistoryFilters(defaultFilters);

    await fetchHistory(product?._id, defaultFilters, 1);
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryLoading(false);
    setHistoryExporting(false);
    setHistoryError("");
    setHistoryProductId("");
    setHistoryProductName("");
    setHistoryEvents([]);
    setHistoryPage(1);
    setHistoryTotalPages(1);
    setHistoryTotalCount(0);
    setHistoryFilters({
      eventType: "",
      source: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const buildHistoryQueryString = (filters, page = 1, limit = 50) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.source) params.set("source", filters.source);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);

    return params.toString();
  };

  const fetchHistory = async (productId, filters, page = 1) => {
    const token = localStorage.getItem("userToken");
    if (!token || !productId) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const qs = buildHistoryQueryString(filters, page, 50);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${productId}/history?${qs}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load product history");

      setHistoryProductName(data?.productName || "Product");
      setHistoryEvents(Array.isArray(data?.events) ? data.events : []);
      setHistoryPage(Number(data?.page || page || 1));
      setHistoryTotalPages(Number(data?.totalPages || 1));
      setHistoryTotalCount(Number(data?.totalCount || 0));
    } catch (err) {
      setHistoryError(err.message || "Failed to load product history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const applyHistoryFilters = async () => {
    if (!historyProductId) return;
    await fetchHistory(historyProductId, historyFilters, 1);
  };

  const clearHistoryFilters = async () => {
    if (!historyProductId) return;
    const cleared = {
      eventType: "",
      source: "",
      dateFrom: "",
      dateTo: "",
    };
    setHistoryFilters(cleared);
    await fetchHistory(historyProductId, cleared, 1);
  };

  const goToHistoryPage = async (page) => {
    if (!historyProductId) return;
    await fetchHistory(historyProductId, historyFilters, page);
  };

  const exportHistoryCsv = async () => {
    const token = localStorage.getItem("userToken");
    if (!token || !historyProductId) return;

    setHistoryExporting(true);
    try {
      const params = new URLSearchParams();
      if (historyFilters.eventType) params.set("eventType", historyFilters.eventType);
      if (historyFilters.source) params.set("source", historyFilters.source);
      if (historyFilters.dateFrom) params.set("dateFrom", historyFilters.dateFrom);
      if (historyFilters.dateTo) params.set("dateTo", historyFilters.dateTo);

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${historyProductId}/history/export-csv?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to export history CSV");
      }

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${historyProductName || "product"}-history.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setHistoryError(err.message || "Failed to export history CSV");
    } finally {
      setHistoryExporting(false);
    }
  };

  const formatHistoryDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const getPersonLabel = (event) => {
    const actor = event?.actorUser;
    const customer = event?.customerUser;
    const actorLabel = actor?.name || actor?.email || "";
    const customerLabel = customer?.name || customer?.email || "";
    if (actorLabel && customerLabel && actorLabel !== customerLabel) {
      return `${actorLabel} -> ${customerLabel}`;
    }
    return actorLabel || customerLabel || "-";
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">  
            <h2 className="text-2xl font-bold">Product Management</h2>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/product-import-template.csv"
                download
                className="inline-flex h-10 items-center justify-center rounded bg-gray-200 px-3 sm:px-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 w-full sm:w-auto"
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
                className="inline-flex h-10 items-center justify-center rounded bg-gray-600 px-3 sm:px-4 text-white transition hover:bg-gray-700 disabled:opacity-60 w-full sm:w-auto"
              >
                {importingCsv ? "Importing..." : "Upload CSV"}
              </button>
              <Link to="/admin/products/add">
                <button className="inline-flex h-10 items-center justify-center rounded bg-blue-600 px-3 sm:px-4 text-white transition hover:bg-blue-700 w-full sm:w-auto">
                  Add Product
                </button>
              </Link>
            </div>
        </div>   
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="min-w-full text-left text-gray-500 text-xs sm:text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                    <tr>
                        <th className="hidden sm:table-cell py-3 px-3 sm:px-4">Image</th>
                        <th className="py-3 px-3 sm:px-4 w-40 sm:w-56">Name</th>
                        <th className="py-3 px-3 sm:px-4">Qty</th>
                        <th className="py-3 px-3 sm:px-4">Price</th>
                        <th className="hidden lg:table-cell py-3 px-3 sm:px-4">SKU</th>
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
                                <td className="hidden sm:table-cell p-3 sm:p-4">
                                  {product.images && product.images.length > 0 ? (
                                    <img
                                      src={product.images[0]?.url} // e.g., "/images/myfile.jpg"
                                      alt={product.images[0]?.altText || product.name}
                                      className="w-16 h-16 object-contain bg-white rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded">
                                      No Image
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 sm:p-4 font-medium text-gray-900 w-40 max-w-40 sm:w-56 sm:max-w-56">
                                  <span className="block truncate" title={product.name}>
                                    {product.name}
                                  </span>
                                </td>
                                <td className="p-3 sm:p-4">{product.countInStock}</td>
                                <td className="p-3 sm:p-4 whitespace-nowrap">
                                  {Number(product.discountPrice || 0) > 0 &&
                                  Number(product.discountPrice || 0) < Number(product.price || 0) ? (
                                    <div>
                                      <div className="text-xs text-gray-400 line-through">
                                        ${Number(product.price || 0).toFixed(2)}
                                      </div>
                                      <div className="font-semibold text-red-600">
                                        On Sale ${Number(product.discountPrice || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  ) : (
                                    `$${Number(product.price || 0).toFixed(2)}`
                                  )}
                                </td>
                                <td className="hidden lg:table-cell p-3 sm:p-4">{product.sku}</td>
                                <td className="p-3 sm:p-4">
                                  <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                                    <Link
                                      to={`/admin/products/${product._id}/edit`}
                                      className="inline-flex h-8 w-16 sm:h-10 sm:w-24 items-center justify-center rounded bg-yellow-500 text-xs sm:text-sm font-semibold text-white hover:bg-yellow-600"
                                    >
                                      Edit
                                    </Link>
                                    <button
                                      onClick={() => openHistory(product)}
                                      className="inline-flex h-8 w-16 sm:h-10 sm:w-24 items-center justify-center rounded bg-indigo-500 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-600"
                                    >
                                      History
                                    </button>
                                    <button
                                      onClick={() => handleDelete(product._id)}
                                      className="inline-flex h-8 w-16 sm:h-10 sm:w-24 items-center justify-center rounded bg-red-500 text-xs sm:text-sm font-semibold text-white hover:bg-red-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-500">
                                No Products found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeHistory}
        >
          <div
            className="w-full max-w-5xl max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                Product History: {historyProductName}
              </h3>
              <button
                onClick={closeHistory}
                className="text-gray-600 hover:text-gray-900 text-xl leading-none"
                aria-label="Close product history"
              >
                X
              </button>
            </div>

            <div className="p-4 overflow-auto max-h-[72vh]">
              <div className="mb-4 border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <select
                    value={historyFilters.eventType}
                    onChange={(e) =>
                      setHistoryFilters((prev) => ({ ...prev, eventType: e.target.value }))
                    }
                    className="border rounded px-2 py-2 text-sm"
                  >
                    <option value="">All Events</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                    <option value="deleted">Deleted</option>
                    <option value="sold">Sold</option>
                  </select>
                  <select
                    value={historyFilters.source}
                    onChange={(e) =>
                      setHistoryFilters((prev) => ({ ...prev, source: e.target.value }))
                    }
                    className="border rounded px-2 py-2 text-sm"
                  >
                    <option value="">All Sources</option>
                    <option value="admin">Admin</option>
                    <option value="csv_import">CSV Import</option>
                    <option value="checkout">Checkout</option>
                    <option value="pos">POS</option>
                  </select>
                  <input
                    type="date"
                    value={historyFilters.dateFrom}
                    onChange={(e) =>
                      setHistoryFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                    }
                    className="border rounded px-2 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={historyFilters.dateTo}
                    onChange={(e) =>
                      setHistoryFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                    }
                    className="border rounded px-2 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={applyHistoryFilters}
                      className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                      Apply
                    </button>
                    <button
                      onClick={clearHistoryFilters}
                      className="bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {historyEvents.length} of {historyTotalCount} events
                  </p>
                  <button
                    onClick={exportHistoryCsv}
                    disabled={historyExporting || historyLoading}
                    className="bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {historyExporting ? "Exporting..." : "Export CSV"}
                  </button>
                </div>
              </div>

              {historyLoading && <p className="text-gray-600">Loading history...</p>}
              {!historyLoading && historyError && (
                <p className="text-red-600 font-medium">{historyError}</p>
              )}
              {!historyLoading && !historyError && historyEvents.length === 0 && (
                <p className="text-gray-600">No product history found yet.</p>
              )}
              {!historyLoading && !historyError && historyEvents.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Event</th>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Qty Delta</th>
                        <th className="px-3 py-2">Before</th>
                        <th className="px-3 py-2">After</th>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyEvents.map((event) => (
                        <tr key={event._id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatHistoryDate(event.createdAt)}
                          </td>
                          <td className="px-3 py-2 capitalize">{event.eventType || "-"}</td>
                          <td className="px-3 py-2 capitalize">{event.source || "-"}</td>
                          <td className="px-3 py-2">{Number(event.quantityDelta || 0)}</td>
                          <td className="px-3 py-2">
                            {event.beforeQty === null || event.beforeQty === undefined
                              ? "-"
                              : Number(event.beforeQty)}
                          </td>
                          <td className="px-3 py-2">
                            {event.afterQty === null || event.afterQty === undefined
                              ? "-"
                              : Number(event.afterQty)}
                          </td>
                          <td className="px-3 py-2">{getPersonLabel(event)}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {event.order ? String(event.order) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!historyLoading && !historyError && historyTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => goToHistoryPage(Math.max(1, historyPage - 1))}
                    disabled={historyPage <= 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <button
                    onClick={() => goToHistoryPage(Math.min(historyTotalPages, historyPage + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
