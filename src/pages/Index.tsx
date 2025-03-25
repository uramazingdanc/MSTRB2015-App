
import { Logo } from "@/components/Logo";
import { ModeSelection } from "@/components/ModeSelection";
import { CircuitBackground } from "@/components/CircuitBackground";

const Index = () => {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-full">
        <CircuitBackground />
        
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-8 mb-16 animate-fade-in">
            <Logo size="xl" />
            
            <div className="glass-card p-6 max-w-2xl text-center">
              <h1 className="text-2xl md:text-3xl font-medium mb-4 tracking-tight">
                MSTRB 2015: Beam Analysis & Design Tool
              </h1>
              <p className="text-white/80">
                Engineering tool for analyzing and designing singly and doubly reinforced beams 
                using NSCP 2015 standards. Select a mode below to get started.
              </p>
            </div>
          </div>
          
          <ModeSelection />
        </div>
      </div>
    </div>
  );
};

export default Index;
