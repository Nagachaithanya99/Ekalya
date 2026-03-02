import React from "react";

export default function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-white/70 md:text-base">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
