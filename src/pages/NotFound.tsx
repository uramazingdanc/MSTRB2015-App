
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CircuitBackground } from "@/components/CircuitBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 relative">
      <CircuitBackground />
      
      <div className="text-center glass-card p-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-white/80 mb-8">Oops! Page not found</p>
        <Button asChild className="bg-white hover:bg-cyan-50 text-engineBlue-700 hover:text-engineBlue-800">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
