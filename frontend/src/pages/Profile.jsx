import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, setUserProfile } from "../redux/slices/authSlice";
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
import RewardsMedal from "../components/Profile/RewardsMedal";

const API = import.meta.env.VITE_BACKEND_URL;
const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const dayOptions = Array.from({ length: 31 }, (_, idx) => idx + 1);

const Profile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const userId = user?._id;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
    },
    birthdayMonth: "",
    birthdayDay: "",
  });

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

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");
        const authToken = token || localStorage.getItem("userToken");
        const { data } = await axios.get(`${API}/api/users/profile`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        dispatch(setUserProfile(data));
        setProfileForm({
          phone: data?.phone || "",
          address: {
            line1: data?.address?.line1 || "",
            line2: data?.address?.line2 || "",
            city: data?.address?.city || "",
            state: data?.address?.state || "",
            zip: data?.address?.zip || "",
          },
          birthdayMonth: data?.birthdayMonth || "",
          birthdayDay: data?.birthdayDay || "",
        });
      } catch (err) {
        setProfileError(err.response?.data?.message || err.message || "Unable to load profile.");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [userId, token, dispatch]);

  // ✅ Fetch classes user RSVP’d to
  useEffect(() => {
    if (!userId) return;

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
  }, [userId, token]);

  useEffect(() => {
    if (!userId || wishlistLoaded) return;
    dispatch(fetchWishlist());
  }, [dispatch, userId, wishlistLoaded]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    dispatch(logout());
    dispatch(clearCart());
    navigate("/", { replace: true });
  };

  const handleAddressChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError("");
      setProfileMessage("");
      const authToken = token || localStorage.getItem("userToken");
      const payload = {
        phone: profileForm.phone,
        address: profileForm.address,
        birthdayMonth: profileForm.birthdayMonth ? Number(profileForm.birthdayMonth) : null,
        birthdayDay: profileForm.birthdayDay ? Number(profileForm.birthdayDay) : null,
      };

      const { data } = await axios.put(`${API}/api/users/profile`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      dispatch(setUserProfile(data));
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || "Unable to save profile.");
    } finally {
      setProfileSaving(false);
    }
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
          <div className="w-full md:w-1/3 lg:w-1/4 shadow-md rounded-lg p-6 bg-white space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{user?.name}</h1>
            <p className="text-sm text-gray-600 mb-4">{user?.email}</p>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-sm font-bold text-center mb-2">Queen Bee Quilts Rewards Program</div>
              <RewardsMedal
                isUnlocked={Number(user?.lifetimeSpend || 0) >= 250}
                lifetimeSpend={user?.lifetimeSpend || 0}
                unlockThreshold={250}
              />
              <div className="mt-3 text-sm text-center">
                <div>
                  Credits Earned:{" "}
                  <span className="font-semibold">{Number(user?.rewardCredits?.creditsEarned || 0)}</span>
                </div>
                <div>
                  Credits Used:{" "}
                  <span className="font-semibold">{Number(user?.rewardCredits?.creditsUsed || 0)}</span>
                </div>
                <div>
                  Credits Available:{" "}
                  <span className="font-semibold">{Number(user?.rewardCredits?.creditsAvailable || 0)}</span>
                </div>
                <div className="mt-1 font-semibold text-green-700">
                  Available Value: ${Number(user?.rewardCredits?.availableAmount || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="rounded-lg border bg-white p-3 space-y-2">
              <div className="text-sm font-bold">Profile Details</div>
              {profileLoading && <div className="text-xs text-gray-600">Loading profile...</div>}
              {profileError && <div className="text-xs text-red-600">{profileError}</div>}
              {profileMessage && <div className="text-xs text-green-700">{profileMessage}</div>}

              <input
                className="w-full rounded border p-2 text-sm"
                placeholder="Phone (optional)"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <input
                className="w-full rounded border p-2 text-sm"
                placeholder="Address line 1 (optional)"
                value={profileForm.address.line1}
                onChange={(e) => handleAddressChange("line1", e.target.value)}
              />
              <input
                className="w-full rounded border p-2 text-sm"
                placeholder="Address line 2 (optional)"
                value={profileForm.address.line2}
                onChange={(e) => handleAddressChange("line2", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full rounded border p-2 text-sm"
                  placeholder="City"
                  value={profileForm.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
                <input
                  className="w-full rounded border p-2 text-sm"
                  placeholder="State"
                  value={profileForm.address.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                />
              </div>
              <input
                className="w-full rounded border p-2 text-sm"
                placeholder="ZIP"
                value={profileForm.address.zip}
                onChange={(e) => handleAddressChange("zip", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full rounded border p-2 text-sm bg-white"
                  value={profileForm.birthdayMonth}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, birthdayMonth: e.target.value }))
                  }
                >
                  <option value="">Birth Month</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded border p-2 text-sm bg-white"
                  value={profileForm.birthdayDay}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, birthdayDay: e.target.value }))
                  }
                >
                  <option value="">Birth Day</option>
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full rounded bg-black text-white py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
              >
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>

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
