import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout } from "../redux/slices/authSlice";
import { clearCart } from "../redux/slices/cartSlice";
import axios from "axios";

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
            {/* My Orders */}
            <div className="rounded-lg bg-white shadow-sm border p-4">
              <MyOrdersPage />
            </div>

            {/* My Classes */}
            <div className="rounded-lg bg-white shadow-sm border p-4">
              <div className="flex items-center justify-between ml-3 mb-3">
                <h2 className="text-2xl font-bold ml-4">My Classes</h2>
                <button
                  onClick={() => navigate("/classes")}
                  className="text-sm font-semibold text-blue-700 hover:underline"
                  type="button"
                >
                  Browse Classes
                </button>
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
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
