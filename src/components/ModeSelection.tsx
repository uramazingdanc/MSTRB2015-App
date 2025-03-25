
import { Link } from "react-router-dom";
import { CircuitBackground } from "./CircuitBackground";
import { ArrowRight, Ruler, Calculator } from "lucide-react";

export const ModeSelection = () => {
  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 justify-center items-center">
      <CircuitBackground />
      
      <ModeButton 
        to="/analysis" 
        title="Analysis" 
        description="Evaluate beam based on input properties"
        icon={<Calculator className="w-6 h-6" />}
      />
      
      <ModeButton 
        to="/design" 
        title="Design" 
        description="Create beam specifications based on applied forces"
        icon={<Ruler className="w-6 h-6" />}
      />
    </div>
  );
};

interface ModeButtonProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ModeButton = ({ to, title, description, icon }: ModeButtonProps) => {
  return (
    <Link 
      to={to}
      className="w-full md:w-1/2 max-w-xs glass-card p-6 flex flex-col items-center gap-4 group"
    >
      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
        {icon}
      </div>
      
      <h3 className="text-xl font-medium">{title}</h3>
      
      <p className="text-sm text-white/80 text-center">{description}</p>
      
      <div className="mt-2 mode-button w-full">
        <span>Go to {title}</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};
