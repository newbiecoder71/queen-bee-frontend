import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const API = import.meta.env.VITE_BACKEND_URL;

const MyClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMyClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("userToken");

        const { data } = await axios.get(`${API}/api/classes/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Error loading classes");
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    loadMyClasses();
  }, []);

  const events = useMemo(() => {
    return classes.map((c) => ({
      id: c._id,
      title: c.title,
      start: c.start,
      end: c.end,
      extendedProps: c,
    }));
  }, [classes]);

  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : "";

  const buildTooltipHtml = (info) => {
    const c = info.event.extendedProps || {};
    const start = info.event.start;
    const end = info.event.end;

    const timeRange =
      start && end ? `${formatTime(start)} – ${formatTime(end)}` : "";

    const price = Number(c.totalPrice ?? 0).toFixed(2);

    return `
      <div style="min-width:220px;">
        <div style="font-weight:700; margin-bottom:4px;">
          ${info.event.title}
        </div>
        ${
          timeRange
            ? `<div style="font-size:12px; opacity:.9;">${timeRange}</div>`
            : ""
        }
        <div style="font-size:12px; margin-top:4px;">
          Total: <b>$${price}</b>
        </div>
      </div>
    `;
  };

  const eventDidMount = (info) => {
    const instance = tippy(info.el, {
      content: buildTooltipHtml(info),
      allowHTML: true,
      placement: "top",
      interactive: true,
      delay: 0,
      duration: 0,
      theme: "violet",
      appendTo: document.body,
    });

    return () => {
      instance?.destroy?.();
    };
  };

  if (loading) {
    return <div className="p-6">Loading your classes…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Classes</h1>

      {!classes.length ? (
        <div className="text-gray-600">
          You haven&apos;t RSVP&apos;d to any classes yet.
        </div>
      ) : (
        <div className="h-[75vh] rounded border bg-white p-2">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            events={events}
            dayMaxEvents={true}
            eventDidMount={eventDidMount}
          />
        </div>
      )}
    </div>
  );
};

export default MyClassesPage;
