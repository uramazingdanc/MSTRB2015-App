
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="w-full bg-engineBlue-800/30 backdrop-blur-md border-b border-white/10 py-2 px-4 md:px-6">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo size="sm" />
        </Link>
        
        <div className="flex gap-4 md:gap-6">
          <NavLink to="/" current={location.pathname === "/"}>
            Home
          </NavLink>
          <NavLink to="/analysis" current={location.pathname === "/analysis"}>
            Analysis
          </NavLink>
          <NavLink to="/design" current={location.pathname === "/design"}>
            Design
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  current: boolean;
  children: React.ReactNode;
}

const NavLink = ({ to, current, children }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "relative text-sm md:text-base text-white/90 hover:text-white transition-all py-2",
        "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300",
        current 
          ? "after:w-full font-medium text-white" 
          : "after:w-0 hover:after:w-full"
      )}
    >
      {children}
    </Link>
  );
};
