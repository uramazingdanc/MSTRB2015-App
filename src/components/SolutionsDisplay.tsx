
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SolutionsDisplayProps {
  solutions: string[];
  finalAnswer: string;
}

export const SolutionsDisplay = ({ solutions, finalAnswer }: SolutionsDisplayProps) => {
  const [showFinalAnswer, setShowFinalAnswer] = useState(false);
  
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="glass-card p-6 flex-1 animate-slide-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-xl font-medium mb-4 text-center">Solutions</h2>
        
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {solutions.map((solution, index) => (
            <div 
              key={index}
              className="p-3 bg-white/10 backdrop-blur rounded-lg animate-fade-in"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              {solution}
            </div>
          ))}
        </div>
      </div>
      
      <div className={cn(
        "glass-card p-6 animate-slide-in transition-all duration-500",
        showFinalAnswer ? "opacity-100" : "opacity-80"
      )} style={{ animationDelay: "200ms" }}>
        <div className="text-center space-y-4">
          {!showFinalAnswer ? (
            <>
              <h3 className="text-lg font-medium">View Final Answer</h3>
              <Button 
                onClick={() => setShowFinalAnswer(true)}
                className="bg-white hover:bg-cyan-50 text-engineBlue-700 hover:text-engineBlue-800"
              >
                Show Final Answer
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-4">Final Answer</h3>
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 animate-zoom-in">
                {finalAnswer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
