import React from "react";

const ComingSoon = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🐝</div>

        <h1 style={{ fontSize: 36, margin: 0 }}>
          Queen Bee Quilts
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.5, marginTop: 12 }}>
          We’re putting the finishing stitches on the shop.
          <br />
          Please check back soon!
        </p>

        <div style={{ marginTop: 28, fontSize: 14, opacity: 0.7 }}>
          © {new Date().getFullYear()} Queen Bee Quilts
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

