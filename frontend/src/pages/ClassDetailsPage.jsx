import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { rsvpToClass } from "../redux/slices/classesSlice";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";

const API = import.meta.env.VITE_BACKEND_URL;

const ClassDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/classes/${id}`);
        if (!canceled) setCls(data);
      } catch (err) {
        if (!canceled) setError(err.response?.data?.message || err.message || "Error loading class");
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [id]);

  const price = Number(cls?.totalPrice ?? 0).toFixed(2);
  const classImageSrc = (url) =>
    url?.startsWith("/uploads") ? `${import.meta.env.VITE_BACKEND_URL}${url}` : url;
  const itemsTotal = useMemo(() => {
    if (!Array.isArray(cls?.requiredItems)) return 0;
    return cls.requiredItems.reduce(
      (sum, it) => sum + Number(it.unitPrice || 0) * Number(it.quantity || 0),
      0
    );
  }, [cls]);

  const handleEnroll = async () => {
    if (!cls?._id) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/classes/${cls._id}`)}`);
      return;
    }

    try {
      setBusy(true);
      try {
        await dispatch(rsvpToClass(cls._id)).unwrap();
      } catch (rsvpErr) {
        const msg = String(rsvpErr || "").toLowerCase();
        if (!msg.includes("already rsvped")) throw rsvpErr;
      }

      await dispatch(
        addToCart({
          itemType: "class",
          classId: cls._id,
          quantity: 1,
          userId: user._id,
        })
      ).unwrap();

      toast.success("Class added to cart");
    } catch (err) {
      toast.error(err || "Could not add class to cart");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto p-6">Loading class...</div>;
  if (error) return <div className="max-w-5xl mx-auto p-6 text-red-600">{error}</div>;
  if (!cls) return <div className="max-w-5xl mx-auto p-6">Class not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/classes" className="text-sm text-blue-700 hover:underline">
        Back to classes
      </Link>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {cls.images?.[0]?.url ? (
            <img
              src={classImageSrc(cls.images[0].url)}
              alt={cls.images[0].altText || cls.title}
              className="w-full h-80 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-full h-80 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-500">
              No class image
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{cls.title}</h1>
          <p className="text-sm text-gray-600">
            {new Date(cls.start).toLocaleString()} - {new Date(cls.end).toLocaleString()}
          </p>
          <p className="text-gray-700">{cls.description || "No description provided."}</p>
          <div className="rounded border bg-gray-50 p-3">
            <div className="flex justify-between text-sm">
              <span>Class Base Price</span>
              <span>${Number(cls.basePrice || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Required Items Total</span>
              <span>${itemsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Class Price</span>
              <span>${price}</span>
            </div>
          </div>

          <button
            onClick={handleEnroll}
            disabled={busy}
            className="rounded bg-black px-4 py-2 text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
          >
            {busy ? "Adding..." : "RSVP + Add To Cart"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Required Items</h2>
        {!cls.requiredItems?.length ? (
          <p className="text-sm text-gray-600">No required items for this class.</p>
        ) : (
          <div className="space-y-2">
            {cls.requiredItems.map((it, idx) => (
              <div key={it.product || idx} className="rounded border p-3 flex justify-between">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  {it.sku && <div className="text-xs text-gray-500">SKU: {it.sku}</div>}
                </div>
                <div className="text-sm">
                  ${Number(it.unitPrice || 0).toFixed(2)} x {Number(it.quantity || 1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetailsPage;
