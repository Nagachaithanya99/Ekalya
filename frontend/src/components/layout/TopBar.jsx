import { Link } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { UserButton } from "@clerk/clerk-react";
import DesktopNavbar from "./DesktopNavbar";
import Logo from "../common/Logo";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07080d]/90 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DesktopNavbar />

        <div className="flex h-14 items-center justify-between md:hidden">
          <Link to="/student" aria-label="Ekalya Learning Platform">
            <Logo size="small" />
          </Link>
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/6">
              <FiBell className="text-white/80" />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
