import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const MyClassesCalendarModal = ({ open, onClose, myClasses }) => {
  if (!open) return null;

  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";

  const buildTooltipHtml = (info) => {
    const c = info.event.extendedProps || {};
    const start = info.event.start;
    const end = info.event.end;

    const timeRange = start && end ? `${formatTime(start)} – ${formatTime(end)}` : "";
    const price = Number(c.totalPrice ?? 0).toFixed(2);

    return `
      <div style="min-width:220px;">
        <div style="font-weight:700; margin-bottom:4px;">${info.event.title}</div>
        ${timeRange ? `<div style="font-size:12px; opacity:.9;">${timeRange}</div>` : ""}
        <div style="font-size:12px; margin-top:4px;">Total: <b>$${price}</b></div>
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

    return () => instance?.destroy?.();
  };

  const events = (myClasses || []).map((c) => ({
    id: c._id,
    title: c.title,
    start: c.start,
    end: c.end,
    extendedProps: c,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">My Classes Calendar</h2>

        <button
          onClick={onClose}
          className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
          type="button"
        >
          Close
        </button>
      </div>

      <div className="h-[calc(100vh-56px)] p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="100%"
          events={events}
          dayMaxEvents={true}
          eventDidMount={eventDidMount}
        />
      </div>
    </div>
  );
};

export default MyClassesCalendarModal;
