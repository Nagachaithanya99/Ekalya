import React from "react";

export default function Button({
  children,
  className = "",
  variant = "primary",
  full = false,
  ...props
}) {
  const base =
    "min-h-11 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7d774]/60";
  const variants = {
    primary: "bg-[#f7d774] text-black hover:brightness-95",
    ghost: "border border-white/15 bg-white/5 text-white hover:bg-white/10",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      {...props}
      className={`${base} ${variants[variant] || variants.primary} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
