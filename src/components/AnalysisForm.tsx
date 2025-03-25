
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SolutionsDisplay } from "./SolutionsDisplay";
import { CircuitBackground } from "./CircuitBackground";
import { toast } from "sonner";

interface AnalysisInputs {
  fc: number;
  fy: number;
  As: number;
  b: number;
  Asprime: number;
  d: number;
  dprime: number;
}

interface AnalysisResults {
  beta: number;
  phi: number;
  Mn: number;
  beamType: 'Singly Reinforced' | 'Doubly Reinforced';
  solutions: string[];
  finalAnswer: string;
}

export const AnalysisForm = () => {
  const [inputs, setInputs] = useState<AnalysisInputs>({
    fc: 21,
    fy: 420,
    As: 1200,
    b: 300,
    Asprime: 400,
    d: 550,
    dprime: 50
  });
  
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (inputs.fc <= 0 || inputs.fy <= 0 || inputs.As <= 0 || inputs.b <= 0 || inputs.d <= 0) {
      toast.error("All values must be positive");
      return;
    }
    
    // Calculate beta
    const beta = inputs.fc <= 28 ? 0.85 : 0.85 - (0.05/7) * (inputs.fc - 28);
    
    // Calculate phi
    const phi = 0.65 + 0.25 * (800 - inputs.fy) / (1000 - inputs.fy);
    
    // Calculate Mn (placeholder - actual beam analysis would be more complex)
    const Mn = (51/140) * beta * inputs.fc * inputs.b * Math.pow(inputs.d, 2) * (1 - 3/14 * beta);
    
    // Determine beam type (simplified)
    const beamType = inputs.Asprime > 0 ? 'Doubly Reinforced' : 'Singly Reinforced';
    
    // Create the results object
    const analysisResults: AnalysisResults = {
      beta,
      phi,
      Mn,
      beamType,
      solutions: [
        `β = ${beta.toFixed(4)}`,
        `φ = ${phi.toFixed(4)}`,
        `Mn = ${Mn.toFixed(2)} kN·m`,
        `Beam Type: ${beamType}`
      ],
      finalAnswer: `The beam is ${beamType} with a nominal moment capacity of ${Mn.toFixed(2)} kN·m.`
    };
    
    setResults(analysisResults);
    setShowResults(true);
    
    toast.success("Analysis completed successfully");
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 relative">
      <CircuitBackground />
      
      <div className="w-full md:w-1/2 glass-card p-6 animate-slide-in">
        <h2 className="text-xl font-medium mb-6 text-center">Analysis Input</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              name="fc"
              label="f'c"
              unit="MPa"
              value={inputs.fc}
              onChange={handleChange}
              tooltip="Compressive strength of concrete"
            />
            
            <InputField
              name="fy"
              label="fy"
              unit="MPa"
              value={inputs.fy}
              onChange={handleChange}
              tooltip="Yield strength of steel"
            />
            
            <InputField
              name="As"
              label="As"
              unit="mm²"
              value={inputs.As}
              onChange={handleChange}
              tooltip="Area of tension reinforcement"
            />
            
            <InputField
              name="b"
              label="b"
              unit="mm"
              value={inputs.b}
              onChange={handleChange}
              tooltip="Width of the beam"
            />
            
            <InputField
              name="Asprime"
              label="A's"
              unit="mm²"
              value={inputs.Asprime}
              onChange={handleChange}
              tooltip="Area of compression reinforcement"
            />
            
            <InputField
              name="d"
              label="d"
              unit="mm"
              value={inputs.d}
              onChange={handleChange}
              tooltip="Effective depth of the beam"
            />
            
            <InputField
              name="dprime"
              label="d'"
              unit="mm"
              value={inputs.dprime}
              onChange={handleChange}
              tooltip="Depth of compression reinforcement"
            />
          </div>
          
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-white hover:bg-cyan-50 text-engineBlue-700 hover:text-engineBlue-800"
            >
              Calculate
            </Button>
          </div>
        </form>
      </div>
      
      <div className="w-full md:w-1/2">
        {showResults && results && (
          <SolutionsDisplay
            solutions={results.solutions}
            finalAnswer={results.finalAnswer}
          />
        )}
      </div>
    </div>
  );
};

interface InputFieldProps {
  name: string;
  label: string;
  unit: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip?: string;
}

const InputField = ({ name, label, unit, value, onChange, tooltip }: InputFieldProps) => {
  return (
    <div className="relative">
      <label htmlFor={name} className="block text-sm font-medium mb-1 text-white/90">
        {label} ({unit})
        {tooltip && (
          <span className="ml-1 text-xs text-white/70 cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      
      <input
        type="number"
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="input-field w-full"
        min="0"
        step="0.01"
      />
    </div>
  );
};
