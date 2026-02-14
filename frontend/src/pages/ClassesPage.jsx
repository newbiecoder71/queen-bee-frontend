import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import { toast } from "sonner";
import { fetchClasses, rsvpToClass } from "../redux/slices/classesSlice";
import { addToCart } from "../redux/slices/cartSlice";
import ClassesCalendarModal from "../components/Classes/ClassesCalendarModal";
import AdminClassEditorModal from "../components/Classes/AdminClassEditorModal";

const ClassesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    classes: classesState,
    loading,
    error,
    rsvpLoading,
    rsvpError,
  } = useSelector((s) => s.classes);

  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === "admin";

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const classesList = Array.isArray(classesState) ? classesState : [];

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const timeRange = (start, end) =>
    start && end ? `${formatTime(start)} - ${formatTime(end)}` : "";

  const rsvpCount = (c) =>
    typeof c.rsvpCount === "number"
      ? c.rsvpCount
      : Array.isArray(c.rsvps)
      ? c.rsvps.length
      : 0;

  const spotsLeft = (c) => {
    if (!c.capacity) return null;
    return Math.max(0, c.capacity - rsvpCount(c));
  };

  const events = useMemo(
    () =>
      classesList.map((c) => ({
        id: c._id,
        title: c.title,
        start: c.start,
        end: c.end,
        extendedProps: c,
      })),
    [classesList]
  );

  const openCreate = () => {
    setEditingClass(null);
    setEditorOpen(true);
  };

  const openEdit = (cls) => {
    if (!isAdmin) return;
    setEditingClass(cls);
    setEditorOpen(true);
  };

  const openRsvp = (cls) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/classes?rsvp=${cls._id}`)}`);
      return;
    }
    setSelectedClass(cls);
    setRsvpOpen(true);
  };

  const submitRsvp = async () => {
    if (!selectedClass) return;
    try {
      try {
        await dispatch(rsvpToClass(selectedClass._id)).unwrap();
      } catch (rsvpErr) {
        const msg = String(rsvpErr || "").toLowerCase();
        if (!msg.includes("already rsvped")) throw rsvpErr;
      }

      const userId = localStorage.getItem("userId");
      await dispatch(
        addToCart({
          itemType: "class",
          classId: selectedClass._id,
          quantity: 1,
          userId,
        })
      ).unwrap();

      toast.success("Class added to your cart");
      setRsvpOpen(false);
    } catch (err) {
      toast.error(err || "Could not add class to cart");
    }
  };

  const handleSaved = () => {
    setEditorOpen(false);
    dispatch(fetchClasses());
  };

  const classImageSrc = (url) =>
    url?.startsWith("/uploads") ? `${import.meta.env.VITE_BACKEND_URL}${url}` : url;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-gray-600 mt-1">
            Browse upcoming classes or open the calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCalendarOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-yellow-400 px-4 py-2 font-semibold hover:bg-yellow-500"
          >
            <FaCalendarAlt />
            Calendar
          </button>

          {isAdmin && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded bg-black px-4 py-2 font-semibold text-white hover:bg-gray-900"
            >
              <FaPlus />
              New Class
            </button>
          )}
        </div>
      </div>

      {loading && <div className="mt-6">Loading...</div>}
      {error && <div className="mt-6 text-red-600">{error}</div>}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {classesList.map((c) => {
          const spots = spotsLeft(c);
          const price = Number(c.totalPrice ?? c.price ?? 0).toFixed(2);

          return (
            <div
              key={c._id}
              className="relative group rounded-lg border p-4 bg-white shadow-sm"
            >
              <Link to={`/classes/${c._id}`} className="block mb-3">
                {c.images?.[0]?.url ? (
                  <img
                    src={classImageSrc(c.images[0].url)}
                    alt={c.images[0].altText || c.title}
                    className="w-full h-48 rounded-md object-cover border"
                  />
                ) : (
                  <div className="w-full h-48 rounded-md border bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                    Class Image
                  </div>
                )}
              </Link>

              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    <Link to={`/classes/${c._id}`} className="hover:underline">
                      {c.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(c.start).toLocaleString()}
                  </p>
                </div>
                <div className="font-semibold">${price}</div>
              </div>

              {c.description && (
                <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                  {c.description}
                </p>
              )}

              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/classes/${c._id}`}
                    className="text-sm font-semibold text-gray-700 hover:underline"
                  >
                    View details
                  </Link>

                  {isAdmin ? (
                    <button
                      onClick={() => openEdit(c)}
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => openRsvp(c)}
                      disabled={spots === 0}
                      className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50"
                    >
                      {spots === 0 ? "Class Full" : "RSVP"}
                    </button>
                  )}
                </div>

                {spots !== null && (
                  <div
                    className={`text-xs font-semibold ${
                      spots === 0
                        ? "text-red-600"
                        : spots <= 3
                        ? "text-orange-600"
                        : "text-gray-700"
                    }`}
                  >
                    {spots} spot{spots === 1 ? "" : "s"} left
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ClassesCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        events={events}
        onEventSelected={(e) => {
          const cls = e.extendedProps ?? e;
          isAdmin ? openEdit(cls) : openRsvp(cls);
        }}
      />

      {isAdmin && (
        <AdminClassEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialValue={editingClass}
          onSaved={handleSaved}
        />
      )}

      {rsvpOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-xl font-bold">{selectedClass.title}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {timeRange(selectedClass.start, selectedClass.end)}
            </p>

            {rsvpError && (
              <div className="mt-3 text-sm text-red-600">{rsvpError}</div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setRsvpOpen(false)}
                className="rounded border px-4 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submitRsvp}
                disabled={rsvpLoading || spotsLeft(selectedClass) === 0}
                className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {rsvpLoading ? "Submitting..." : "RSVP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
