import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const QuiltingCalendar = ({ quiltingOrders, selectedDate, setSelectedDate }) => {
  return (
    <Calendar
      value={selectedDate}
      onChange={setSelectedDate}
      tileContent={({ date }) => {
        // Filter orders for this date (dropped off or picked up)
        const dayOrders = quiltingOrders.filter(
          (order) =>
            (order.dateDroppedOff && new Date(order.dateDroppedOff).toDateString() === date.toDateString()) ||
            (order.datePickedUp && new Date(order.datePickedUp).toDateString() === date.toDateString())
        );

        if (dayOrders.length === 0) return null;

        return dayOrders.map((order, index) => (
          <div
            key={index}
            style={{
              fontSize: "0.65rem",
              color: order.status === "Completed" ? "green" : order.status === "In Progress" ? "orange" : "blue",
              marginBottom: "2px",
            }}
            title={`Pattern: ${order.pattern || "N/A"} | Status: ${order.status} | Notes: ${order.notes || ""}`}
          >
            {order.widthInches}x{order.heightInches} - {order.pattern || "N/A"} ({order.status})
          </div>
        ));
      }}
    />
  );
};

export default QuiltingCalendar;