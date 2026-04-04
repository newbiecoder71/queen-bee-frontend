import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const toCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const AdminGiftCardsPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("userToken");

  const fetchCards = async (searchText = "") => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (String(searchText || "").trim()) params.search = String(searchText).trim();
      const { data } = await axios.get(`${API}/api/admin/pos/gift-cards`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load gift cards.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchCards(search);
  };

  const summary = useMemo(() => {
    const totalCount = cards.length;
    const activeCount = cards.filter((c) => String(c.status) === "active").length;
    const totalBalance = cards.reduce((sum, c) => sum + Number(c.balance || 0), 0);
    return {
      totalCount,
      activeCount,
      totalBalance: Number(totalBalance.toFixed(2)),
    };
  }, [cards]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gift Cards</h1>
          <p className="text-sm text-gray-600">
            View all issued gift cards and retrieve card numbers.
          </p>
        </div>
        <form onSubmit={onSearch} className="flex w-full max-w-xl gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by card #, recipient name, or email"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-purple-fill px-4 py-2 text-sm font-semibold text-white hover:bg-purple-900"
          >
            Find
          </button>
        </form>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border bg-white p-3">
          <div className="text-xs uppercase text-gray-500">Total Cards</div>
          <div className="text-xl font-bold">{summary.totalCount}</div>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="text-xs uppercase text-gray-500">Active Cards</div>
          <div className="text-xl font-bold">{summary.activeCount}</div>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="text-xs uppercase text-gray-500">Current Balance</div>
          <div className="text-xl font-bold">{toCurrency(summary.totalBalance)}</div>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded border bg-white p-3 text-sm text-gray-600">Loading gift cards...</div>}

      {!loading && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Card Number</th>
                <th className="px-3 py-2">Owner / Recipient</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Initial</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2">Issued</th>
                <th className="px-3 py-2">Issued By</th>
                <th className="px-3 py-2">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                    No gift cards found.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card._id} className="border-t">
                    <td className="px-3 py-2 align-top">
                      <div className="font-mono text-xs md:text-sm">{card.cardNumber}</div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(String(card.cardNumber || ""))}
                        className="mt-1 rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                      >
                        Copy
                      </button>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-semibold">{card.recipientName || "Not provided"}</div>
                      <div className="text-xs text-gray-600">{card.recipientEmail || "-"}</div>
                    </td>
                    <td className="px-3 py-2 align-top capitalize">{card.type || "-"}</td>
                    <td className="px-3 py-2 align-top capitalize">{card.status || "-"}</td>
                    <td className="px-3 py-2 align-top text-right">{toCurrency(card.initialBalance)}</td>
                    <td className="px-3 py-2 align-top text-right font-semibold">{toCurrency(card.balance)}</td>
                    <td className="px-3 py-2 align-top">{formatDateTime(card.issuedAt)}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-semibold">{card.issuedBy?.name || "-"}</div>
                      <div className="text-xs text-gray-600">{card.issuedBy?.email || ""}</div>
                    </td>
                    <td className="px-3 py-2 align-top">{formatDateTime(card.lastUsedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminGiftCardsPage;
