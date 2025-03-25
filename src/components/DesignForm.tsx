
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SolutionsDisplay } from "./SolutionsDisplay";
import { CircuitBackground } from "./CircuitBackground";
import { toast } from "sonner";

interface DesignInputs {
  fc: number;
  fy: number;
  MD: number;
  ML: number;
  MU: number;
  b: number;
  d: number;
  dprime: number;
}

interface DesignResults {
  beta: number;
  phi: number;
  Mnmax: number;
  beamType: 'Singly Reinforced' | 'Doubly Reinforced';
  As: number;
  Asprime: number;
  solutions: string[];
  finalAnswer: string;
}

export const DesignForm = () => {
  const [inputs, setInputs] = useState<DesignInputs>({
    fc: 21,
    fy: 420,
    MD: 50,
    ML: 30,
    MU: 120,
    b: 300,
    d: 550,
    dprime: 50
  });
  
  const [results, setResults] = useState<DesignResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (inputs.fc <= 0 || inputs.fy <= 0 || inputs.b <= 0 || inputs.d <= 0) {
      toast.error("All values must be positive");
      return;
    }
    
    // Calculate beta
    const beta = inputs.fc <= 28 ? 0.85 : 0.85 - (0.05/7) * (inputs.fc - 28);
    
    // Calculate phi
    const phi = 0.65 + 0.25 * (800 - inputs.fy) / (1000 - inputs.fy);
    
    // Calculate Mnmax
    const Mnmax = (51/140) * beta * inputs.fc * inputs.b * Math.pow(inputs.d, 2) * (1 - 3/14 * beta);
    
    // Determine beam type
    const beamType = inputs.MU > Mnmax ? 'Doubly Reinforced' : 'Singly Reinforced';
    
    // Calculate required reinforcement (simplified)
    let As = 0;
    let Asprime = 0;
    
    if (beamType === 'Singly Reinforced') {
      // Simplified formula for singly reinforced beam
      const rho = 0.85 * (inputs.fc / inputs.fy) * (1 - Math.sqrt(1 - (2 * inputs.MU * 1000000) / (0.85 * inputs.fc * inputs.b * Math.pow(inputs.d, 2))));
      As = rho * inputs.b * inputs.d;
      Asprime = 0;
    } else {
      // Simplified formula for doubly reinforced beam
      const excessMoment = inputs.MU - Mnmax;
      Asprime = (excessMoment * 1000000) / (0.85 * inputs.fy * (inputs.d - inputs.dprime));
      
      // Calculate tension reinforcement
      const rho = 0.85 * (inputs.fc / inputs.fy) * (1 - Math.sqrt(1 - (2 * Mnmax * 1000000) / (0.85 * inputs.fc * inputs.b * Math.pow(inputs.d, 2))));
      As = rho * inputs.b * inputs.d + Asprime * (inputs.fy / inputs.fy);
    }
    
    // Create the results object
    const designResults: DesignResults = {
      beta,
      phi,
      Mnmax,
      beamType,
      As,
      Asprime,
      solutions: [
        `β = ${beta.toFixed(4)}`,
        `φ = ${phi.toFixed(4)}`,
        `Mnmax = ${Mnmax.toFixed(2)} kN·m`,
        `Beam Type: ${beamType}`,
        `Required As = ${As.toFixed(2)} mm²`,
        `Required A's = ${Asprime.toFixed(2)} mm²`,
      ],
      finalAnswer: `The beam requires ${As.toFixed(0)} mm² of tension reinforcement${beamType === 'Doubly Reinforced' ? ` and ${Asprime.toFixed(0)} mm² of compression reinforcement` : ''}.`
    };
    
    setResults(designResults);
    setShowResults(true);
    
    toast.success("Design completed successfully");
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 relative">
      <CircuitBackground />
      
      <div className="w-full md:w-1/2 glass-card p-6 animate-slide-in">
        <h2 className="text-xl font-medium mb-6 text-center">Design Input</h2>
        
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
              name="MD"
              label="MD"
              unit="kN·m"
              value={inputs.MD}
              onChange={handleChange}
              tooltip="Design moment"
            />
            
            <InputField
              name="ML"
              label="ML"
              unit="kN·m"
              value={inputs.ML}
              onChange={handleChange}
              tooltip="Live load moment"
            />
            
            <InputField
              name="MU"
              label="MU"
              unit="kN·m"
              value={inputs.MU}
              onChange={handleChange}
              tooltip="Ultimate moment"
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
