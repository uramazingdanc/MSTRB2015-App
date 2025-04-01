
import { AnalysisForm } from "@/components/AnalysisForm";

const Analysis = () => {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] py-12 px-4">
      <div className="max-w-4xl mx-auto mb-10 text-center animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-medium mb-3">Beam Analysis</h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Enter the properties of your rectangular beam to analyze its moment capacity (Mu) 
          according to NSCP 2015 standards. The analysis will determine if the beam is 
          singly or doubly reinforced and calculate the appropriate moment capacity.
        </p>
      </div>
      
      <AnalysisForm />
    </div>
  );
};

export default Analysis;
