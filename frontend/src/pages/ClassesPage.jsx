import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import {
  fetchClasses,
  rsvpToClass,
} from "../redux/slices/classesSlice";
import ClassesCalendarModal from "../components/classes/ClassesCalendarModal";
import AdminClassEditorModal from "../components/classes/AdminClassEditorModal";

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

  /* ---------------- helpers ---------------- */

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const timeRange = (start, end) =>
    start && end ? `${formatTime(start)} – ${formatTime(end)}` : "";

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

  /* ---------------- calendar events ---------------- */

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

  /* ---------------- actions ---------------- */

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
    await dispatch(rsvpToClass(selectedClass._id)).unwrap();
    setRsvpOpen(false);
  };

  const handleSaved = () => {
    setEditorOpen(false);
    dispatch(fetchClasses());
  };

  /* ---------------- render ---------------- */

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

      {loading && <div className="mt-6">Loading…</div>}
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

              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
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

      {/* RSVP modal */}
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
                {rsvpLoading ? "Submitting…" : "RSVP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
