import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const ClassesCalendarModal = ({ open, onClose, events, onEventSelected }) => {
  if (!open) return null;

  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";

  const getRsvpCount = (c) => {
    if (typeof c?.rsvpCount === "number") return c.rsvpCount;
    if (Array.isArray(c?.rsvps)) return c.rsvps.length;
    return 0;
  };

  const getSpotsLeft = (c) => {
    const cap = Number(c?.capacity ?? 0);
    if (!cap) return null;
    return Math.max(0, cap - getRsvpCount(c));
  };

  const buildTooltipHtml = (info) => {
    const c = info.event.extendedProps || {};
    const start = info.event.start;
    const end = info.event.end;

    const timeRange = start && end ? `${formatTime(start)} – ${formatTime(end)}` : "";
    const price = Number(c.totalPrice ?? c.price ?? 0).toFixed(2);
    const spotsLeft = getSpotsLeft(c);

    return `
      <div style="min-width:220px;">
        <div style="font-weight:700; margin-bottom:4px;">${info.event.title}</div>
        ${timeRange ? `<div style="font-size:12px; opacity:.9;">${timeRange}</div>` : ""}
        <div style="font-size:12px; margin-top:4px;">Total: <b>$${price}</b></div>
        ${
          spotsLeft !== null
            ? `<div style="font-size:12px; margin-top:2px;">Spots left: <b>${spotsLeft}</b></div>`
            : ""
        }
      </div>
    `;
  };

  // ✅ Instant tooltip on hover (no browser delay)
  const eventDidMount = (info) => {
    const instance = tippy(info.el, {
      content: buildTooltipHtml(info),
      allowHTML: true,
      placement: "top",
      interactive: true,
      delay: 0,         // ✅ instant
      duration: 0,      // ✅ instant
      theme: "violet",
      trigger: "mouseenter focus",
      appendTo: document.body, // prevents clipping in modal
    });

    // Clean up when FullCalendar removes/re-renders the element
    return () => {
      instance?.destroy?.();
    };
  };

  const eventContent = (arg) => {
    const c = arg.event.extendedProps || {};
    const timeText = arg.timeText || ""; // ex: "10a"
    const title = arg.event.title || "";

    const spotsLeft = getSpotsLeft(c);

    // Dot color:
    // green = 2+ spots (or capacity not set)
    // yellow = 1 spot left
    // red = 0 spots left (full)
    let dotColor = "#22c55e"; // green-500
    if (spotsLeft === 1) dotColor = "#eab308"; // yellow-500
    if (spotsLeft === 0) dotColor = "#ef4444"; // red-500

    return {
      html: `
        <div style="display:flex; align-items:flex-start; gap:6px; line-height:1.1;">
          <span
            style="
              width:8px;
              height:8px;
              border-radius:999px;
              background:${dotColor};
              margin-top:4px;
              flex:0 0 auto;
            "
          ></span>

          <div style="display:flex; flex-direction:column; line-height:1.1;">
            <div style="font-size:12px; font-weight:600;">${title}</div>
            ${timeText ? `<div style="font-size:11px; font-weight:600;">${timeText}</div>` : ""}
          </div>
        </div>
      `,
    };
  };  

  return (
    <div className="fixed inset-0 z-50 bg-violet-50">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">Class Calendar</h2>

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
          eventContent={eventContent} // remove if you only want hover tooltip
          eventClick={(info) => {
            onEventSelected?.(info.event.extendedProps);
          }}
        />
      </div>
    </div>
  );
};

export default ClassesCalendarModal;
