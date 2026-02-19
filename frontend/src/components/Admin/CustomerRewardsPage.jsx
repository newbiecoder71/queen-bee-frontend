import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const CustomerRewardsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    rewardAmount: 20,
    firstUnlockSpend: 250,
    additionalSpendStep: 250,
  });
  const [customers, setCustomers] = useState([]);

  const token = localStorage.getItem("userToken");

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API,
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token]
  );

  const loadRewards = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/api/users/admin/rewards");
      setSummary({
        rewardAmount: Number(data?.rewardAmount || 20),
        firstUnlockSpend: Number(data?.firstUnlockSpend || 250),
        additionalSpendStep: Number(data?.additionalSpendStep || 250),
      });
      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load rewards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Customer Rewards</h1>
        <button
          type="button"
          onClick={loadRewards}
          className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {loading && <div className="text-sm text-gray-600">Loading rewards...</div>}

      <section className="rounded-xl border bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-400 px-4 py-3">
          <h2 className="text-lg font-bold">Rewards Credit Tracking</h2>
          <div className="text-sm font-semibold text-gray-800">
            First credit at {formatMoney(summary.firstUnlockSpend)}. Then earn{" "}
            {formatMoney(summary.rewardAmount)} every additional{" "}
            {formatMoney(summary.additionalSpendStep)} spent.
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No customer reward records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Customer</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-right px-4 py-2">Total Spent</th>
                  <th className="text-right px-4 py-2">Credits Earned</th>
                  <th className="text-right px-4 py-2">Credits Used</th>
                  <th className="text-right px-4 py-2">Credits Unused</th>
                  <th className="text-right px-4 py-2">Unused Value</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((u, idx) => (
                  <tr key={u._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 font-semibold">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(u.lifetimeSpend)}</td>
                    <td className="px-4 py-2 text-right">{Number(u.rewardCreditsEarned || 0)}</td>
                    <td className="px-4 py-2 text-right">{Number(u.rewardCreditsUsed || 0)}</td>
                    <td className="px-4 py-2 text-right">{Number(u.rewardCreditsAvailable || 0)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(u.availableAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerRewardsPage;
