import React from "react";

export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-xs text-white/85 ${className}`}
    >
      {children}
    </span>
  );
}
