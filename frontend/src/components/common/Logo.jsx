import logoImage from "../../assets/logo/ekalya-logo.svg";

const SIZE_MAP = {
  small: "h-8 w-auto",
  medium: "h-10 w-auto",
  large: "h-14 w-auto",
};

export default function Logo({ size = "medium", className = "" }) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.medium;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logoImage}
        alt="Ekalya Learning Platform Logo"
        className={`${sizeClass} object-contain`}
        loading="eager"
      />
    </div>
  );
}
