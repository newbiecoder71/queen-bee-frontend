import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout } from "../redux/slices/authSlice";
import { clearCart } from "../redux/slices/cartSlice";
import axios from "axios";
import MyClassesCalendarModal from "../components/Classes/MyClassesCalendarModal";
import { FaCalendarAlt } from "react-icons/fa";
import { FaGoogle, FaApple } from "react-icons/fa";
import { HiHeart } from "react-icons/hi2";
import { addToCart } from "../redux/slices/cartSlice";
import {
  fetchWishlist,
  removeFromWishlist,
} from "../redux/slices/wishlistSlice";

const API = import.meta.env.VITE_BACKEND_URL;

const Profile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ My Classes state
  const [myClasses, setMyClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState(null);
  const [myClassesCalendarOpen, setMyClassesCalendarOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [addingClassId, setAddingClassId] = useState(null);
  const [removingFavoriteId, setRemovingFavoriteId] = useState(null);
  const {
    items: wishlistItems,
    hasLoaded: wishlistLoaded,
    loading: wishlistLoading,
  } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (!user && !isLoggingOut) {
      navigate("/login");
    }
  }, [user, isLoggingOut, navigate]);

  // ✅ Fetch classes user RSVP’d to
  useEffect(() => {
    if (!user) return;

    const loadMyClasses = async () => {
      try {
        setClassesLoading(true);
        setClassesError(null);

        const authToken = token || localStorage.getItem("userToken");

        const { data } = await axios.get(`${API}/api/classes/my`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        setMyClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        setClassesError(err.response?.data?.message || err.message || "Error loading classes");
        setMyClasses([]);
      } finally {
        setClassesLoading(false);
      }
    };

    loadMyClasses();
  }, [user, token]);

  useEffect(() => {
    if (!user || wishlistLoaded) return;
    dispatch(fetchWishlist());
  }, [dispatch, user, wishlistLoaded]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    dispatch(logout());
    dispatch(clearCart());
    navigate("/", { replace: true });
  };

  const formatDateTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleCancelRsvp = async (classId) => {
    try {
      setCancelingId(classId);
  
      const authToken = token || localStorage.getItem("userToken");
  
      await axios.post(
        `${API}/api/classes/${classId}/cancel-rsvp`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
  
      // ✅ Remove from "My Classes" list instantly
      setMyClasses((prev) => prev.filter((c) => c._id !== classId));
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Error canceling RSVP");
    } finally {
      setCancelingId(null);
    }
  };
  
  const pad2 = (n) => String(n).padStart(2, "0");

  // Google Calendar wants UTC timestamps like: 20260208T190000Z
  const toGoogleUtc = (date) => {
    const d = new Date(date);
    return (
      d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      "00Z"
    );
  };

  const buildGoogleCalendarUrl = (cls) => {
    const text = cls.title || "Queen Bee Quilts Class";
    const detailsParts = [];

    if (cls.instructor) detailsParts.push(`Instructor: ${cls.instructor}`);
    if (cls.description) detailsParts.push(cls.description);
    if (typeof cls.totalPrice !== "undefined")
      detailsParts.push(`Total: $${Number(cls.totalPrice ?? 0).toFixed(2)}`);

    const details = detailsParts.join("\n\n");

    const start = cls.start ? toGoogleUtc(cls.start) : "";
    const end = cls.end ? toGoogleUtc(cls.end) : start;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text,
      dates: `${start}/${end}`,
      details,
      // location: cls.location || "", // if you add a location field later
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // ICS for Apple/Outlook/etc.
  const escapeIcs = (s = "") =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const toIcsUtc = (date) => {
    const d = new Date(date);
    return (
      d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      "Z"
    );
  };

  const downloadIcs = (cls) => {
    const uid = `${cls._id || Date.now()}@queenbeequilts`;
    const dtstamp = toIcsUtc(new Date());
    const dtstart = toIcsUtc(cls.start);
    const dtend = cls.end ? toIcsUtc(cls.end) : dtstart;

    const summary = escapeIcs(cls.title || "Queen Bee Quilts Class");
    const descriptionParts = [];
    if (cls.instructor) descriptionParts.push(`Instructor: ${cls.instructor}`);
    if (cls.description) descriptionParts.push(cls.description);
    if (typeof cls.totalPrice !== "undefined")
      descriptionParts.push(`Total: $${Number(cls.totalPrice ?? 0).toFixed(2)}`);

    const description = escapeIcs(descriptionParts.join("\n\n"));

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Queen Bee Quilts//Classes//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${(cls.title || "class").replace(/[^\w-]+/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleAddClassToCart = async (cls) => {
    try {
      setAddingClassId(cls._id);
      const userId = token ? user?._id : localStorage.getItem("userId");
      await dispatch(
        addToCart({
          itemType: "class",
          classId: cls._id,
          quantity: 1,
          userId,
        })
      ).unwrap();
      alert("Class added to cart.");
    } catch (err) {
      alert(err || "Could not add class to cart");
    } finally {
      setAddingClassId(null);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      setRemovingFavoriteId(productId);
      await dispatch(removeFromWishlist(productId)).unwrap();
    } catch (err) {
      alert(err || "Error removing favorite");
    } finally {
      setRemovingFavoriteId(null);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
          {/* Left Section */}
          <div className="w-full md:w-1/3 lg:w-1/4 shadow-md rounded-lg p-6 bg-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{user?.name}</h1>
            <p className="text-sm text-gray-600 mb-4">{user?.email}</p>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 px-4 rounded font-semibold hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {/* Right Section - Orders + Classes */}
          <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
            <div className="rounded-lg bg-white shadow-sm border p-4">
              <div className="flex items-center justify-between ml-3 mb-3">
                <h2 className="text-2xl font-bold ml-4">My Favorites</h2>
              </div>

              {wishlistLoading && (
                <div className="text-sm text-gray-600">Loading favorites...</div>
              )}

              {!wishlistLoading && wishlistItems.length === 0 && (
                <div className="text-sm text-gray-600">
                  You have not saved any favorites yet.
                </div>
              )}

              {!wishlistLoading && wishlistItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {wishlistItems.map((item) => (
                    <div key={item._id} className="rounded-lg shadow-md border ml-5 p-3">
                      <div className="flex items-start gap-3">
                        <Link to={`/product/${item._id}`} className="shrink-0">
                          {item.images?.[0]?.url ? (
                            <img
                              src={item.images[0].url}
                              alt={item.images[0].altText || item.name}
                              className="h-16 w-16 rounded object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded bg-gray-100" />
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/product/${item._id}`}
                            className="font-semibold hover:underline line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <div className="text-sm text-gray-600 mt-1">
                            ${Number(item.price ?? 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleRemoveFavorite(item._id)}
                          disabled={removingFavoriteId === item._id}
                          className={`inline-flex items-center gap-2 rounded px-3 py-1 text-sm font-semibold border ${
                            removingFavoriteId === item._id
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-white hover:bg-red-50 text-red-600 border-red-300"
                          }`}
                          type="button"
                        >
                          <HiHeart className="h-4 w-4" />
                          {removingFavoriteId === item._id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Orders */}
            <div className="rounded-lg bg-white shadow-sm border p-4">
              <MyOrdersPage />
            </div>

            {/* My Classes */}
            <div className="rounded-lg bg-white shadow-sm border p-4">
              <div className="flex items-center justify-between ml-3 mb-3">
                <h2 className="text-2xl font-bold ml-4">My Classes</h2>

                <div className="flex items-center gap-3 mr-4">
                  <button
                    onClick={() => setMyClassesCalendarOpen(true)}
                    className="inline-flex items-center gap-2 rounded bg-yellow-400 px-4 py-2 font-semibold hover:bg-yellow-500"
                    type="button"
                  >
                    <FaCalendarAlt />
                    Calendar View
                  </button>
                </div>
              </div>

              {classesLoading && <div className="text-sm text-gray-600">Loading your classes…</div>}
              {classesError && <div className="text-sm text-red-600">{classesError}</div>}

              {!classesLoading && !classesError && myClasses.length === 0 && (
                <div className="text-sm text-gray-600">
                  You haven&apos;t RSVP&apos;d to any classes yet.
                </div>
              )}

              {!classesLoading && myClasses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myClasses.map((c) => (
                    <div key={c._id} className="rounded-lg shadow-md border ml-5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatDateTime(c.start)}
                            {c.end ? ` → ${formatDateTime(c.end)}` : ""}
                          </div>
                        </div>

                        <div className="text-sm font-bold">
                          ${Number(c.totalPrice ?? 0).toFixed(2)}
                        </div>
                      </div>

                      {c.instructor && (
                        <div className="text-xs text-gray-600 mt-2">
                          Instructor: <span className="font-semibold">{c.instructor}</span>
                        </div>
                      )}

                      {c.description && (
                        <div className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {c.description}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* Google Calendar */}
                        <a
                          href={buildGoogleCalendarUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold
                                    bg-white border border-gray-300 text-gray-800
                                    hover:bg-gray-100 hover:border-gray-400 transition"
                        >
                          <FaGoogle className="text-[#4285F4]" />
                          Google Calendar
                        </a>

                        {/* Apple / iCal */}
                        <button
                          onClick={() => downloadIcs(c)}
                          className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold
                                    bg-black text-white
                                    hover:bg-gray-900 transition"
                          type="button"
                        >
                          <FaApple className="text-white" />
                          Apple Calendar
                        </button>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleAddClassToCart(c)}
                          disabled={addingClassId === c._id}
                          className={`rounded px-3 py-1 text-sm font-semibold border mr-2 ${
                            addingClassId === c._id
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                          }`}
                          type="button"
                        >
                          {addingClassId === c._id ? "Adding..." : "Add To Cart"}
                        </button>
                        <button
                          onClick={() => handleCancelRsvp(c._id)}
                          disabled={cancelingId === c._id}
                          className={`rounded px-3 py-1 text-sm font-semibold border ${
                            cancelingId === c._id
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-white hover:bg-red-50 text-red-600 border-red-300"
                          }`}
                          type="button"
                        >
                          {cancelingId === c._id ? "Canceling..." : "Cancel RSVP"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {myClassesCalendarOpen && (
              <MyClassesCalendarModal
                open={myClassesCalendarOpen}
                onClose={() => setMyClassesCalendarOpen(false)}
                myClasses={myClasses}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
