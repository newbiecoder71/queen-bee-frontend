import React from "react";

const QuiltingTable = ({ quiltingOrders, isAdmin, onMarkPaid }) => {
  return (
    <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Dimensions (WxH)</th>
          <th>Sq Inches</th>
          <th>Pattern</th>
          <th>Thread Color</th>
          <th>Backing</th>
          <th>Batting</th>
          <th>Backing Prep</th>
          <th>Dropped Off</th>
          <th>Picked Up</th>
          <th>Status</th>
          <th>Notes</th>
          <th>Photo</th>
          {isAdmin && <th>Paid</th>}
          {isAdmin && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {quiltingOrders.map((o) => (
          <tr key={o._id}>
            <td>{o.widthInches} x {o.heightInches}</td>
            <td>{o.squareInches}</td>
            <td>{o.pattern || "N/A"}</td>
            <td>{o.threadColor || "N/A"}</td>
            <td>{o.backing || "N/A"}</td>
            <td>{o.batting || "N/A"}</td>
            <td>{o.backingPrep ? "Yes" : "No"}</td>
            <td>{o.dateDroppedOff ? new Date(o.dateDroppedOff).toLocaleDateString() : ""}</td>
            <td>{o.datePickedUp ? new Date(o.datePickedUp).toLocaleDateString() : ""}</td>
            <td>{o.status || "Pending"}</td>
            <td>{o.notes || ""}</td>
            <td>
              {o.photo ? <img src={o.photo} alt="quilt" width="50" /> : "N/A"}
            </td>
            {isAdmin && <td>{o.isPaid ? "Yes" : "No"}</td>}
            {isAdmin && (
              <td>
                {!o.isPaid && (
                  <button
                    onClick={() => onMarkPaid(o._id)}
                    style={{ padding: "5px 10px", cursor: "pointer" }}
                  >
                    Mark Paid
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default QuiltingTable;