
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-24",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Circuit board graphic elements */}
        <div className="relative h-full aspect-square">
          <div className="circuit-line w-[2px] h-[40%] left-[30%] top-[10%]"></div>
          <div className="circuit-line w-[2px] h-[40%] left-[70%] top-[50%]"></div>
          <div className="circuit-line h-[2px] w-[40%] left-[30%] top-[10%]"></div>
          <div className="circuit-line h-[2px] w-[40%] left-[30%] top-[50%]"></div>
          <div className="circuit-line h-[2px] w-[30%] left-[40%] top-[90%]"></div>
          
          <div className="circuit-node w-[6px] h-[6px] left-[30%] top-[10%]"></div>
          <div className="circuit-node w-[6px] h-[6px] left-[70%] top-[10%]"></div>
          <div className="circuit-node w-[6px] h-[6px] left-[30%] top-[50%]"></div>
          <div className="circuit-node w-[6px] h-[6px] left-[70%] top-[50%]"></div>
          <div className="circuit-node w-[6px] h-[6px] left-[40%] top-[90%]"></div>
          <div className="circuit-node w-[6px] h-[6px] left-[70%] top-[90%]"></div>
          
          {/* Center circle */}
          <div className="absolute inset-[15%] rounded-full border-2 border-cyan-400/70 bg-engineBlue-700"></div>
          
          {/* Logo letter */}
          {showText && (
            <div className="absolute inset-[15%] flex items-center justify-center">
              <span className="text-white font-bold tracking-wider" style={{ fontSize: `${size === "sm" ? 0.7 : size === "md" ? 1 : size === "lg" ? 1.3 : 2}rem` }}>MSTRB</span>
            </div>
          )}
        </div>
      </div>
      
      {showText && (
        <div className="ml-2 text-white" style={{ fontSize: `${size === "sm" ? 0.7 : size === "md" ? 1 : size === "lg" ? 1.3 : 2}rem` }}>
          <span className="font-bold tracking-wider">MSTRB</span>
          <span className="font-light tracking-wide text-xs align-top ml-0.5">2015</span>
        </div>
      )}
    </div>
  );
};
