import React from "react";

export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/12 bg-white/5 shadow-sm backdrop-blur-md transition hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}
