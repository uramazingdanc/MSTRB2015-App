
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
    
    // Step 1: Compute Cmax
    const cmax = (3 * inputs.d) / 7;
    
    // Step 2: Determine beta based on conditions
    let beta: number;
    if (inputs.fc >= 17 && inputs.fc <= 28) {
      beta = 0.85;
    } else if (inputs.fc > 28 && inputs.fc < 55) {
      beta = 0.85 - (0.05/7) * (inputs.fc - 28);
    } else {
      beta = 0.65;
    }
    
    // Step 3: Compute Amax
    const amax = beta * cmax;
    
    // Step 4: Compute Asmax
    const asmax = (0.85 * inputs.fc * amax * inputs.b) / inputs.fy;
    
    // Step 5: Compare Asmax and As to determine beam type
    const beamType = asmax > inputs.As ? 'Singly Reinforced' : 'Doubly Reinforced';
    
    let solutions = [
      `Step 1: Compute Cmax = (3d)/7 = (3 × ${inputs.d})/7 = ${cmax.toFixed(2)} mm`,
      `Step 2: Determine β = ${beta.toFixed(4)}`,
      `Step 3: Compute Amax = β × Cmax = ${beta.toFixed(4)} × ${cmax.toFixed(2)} = ${amax.toFixed(2)} mm`,
      `Step 4: Compute Asmax = (0.85 × f'c × Amax × b)/fy = (0.85 × ${inputs.fc} × ${amax.toFixed(2)} × ${inputs.b})/${inputs.fy} = ${asmax.toFixed(2)} mm²`,
      `Step 5: Compare Asmax and As: ${asmax.toFixed(2)} ${asmax > inputs.As ? '>' : '<'} ${inputs.As} → ${beamType}`
    ];
    
    let phi: number;
    let Mn: number;
    let finalAnswer: string;
    
    if (beamType === 'Singly Reinforced') {
      // For Singly Reinforced Beams
      // Step 6: Compute a and c
      const a = (inputs.As * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      const c = a / beta;
      
      // Step 7: Compute fs 
      const fs = 600 * ((inputs.d - c) / c);
      const fsStatus = fs >= inputs.fy ? "fs ≥ fy, steel yields" : "fs < fy, steel does not yield";
      
      // Step 8: Compute reduction factor Ø
      phi = fs >= inputs.fy ? 0.9 : (0.65 + 0.25 * ((fs - inputs.fy) / (600 - inputs.fy)));
      phi = Math.min(Math.max(phi, 0.65), 0.9); // Ensure phi is between 0.65 and 0.9
      
      // Step 9: Compute Mu
      Mn = phi * inputs.As * inputs.fy * (inputs.d - a/2) / 1000000; // Convert to kN·m
      
      solutions = [
        ...solutions,
        `Step 6: Compute a = (As × fy)/(0.85 × f'c × b) = (${inputs.As} × ${inputs.fy})/(0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`,
        `         Compute c = a/β = ${a.toFixed(2)}/${beta.toFixed(4)} = ${c.toFixed(2)} mm`,
        `Step 7: Compute fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${c.toFixed(2)})/${c.toFixed(2)}) = ${fs.toFixed(2)} MPa`,
        `         ${fsStatus}`,
        `Step 8: Compute reduction factor Ø = ${phi.toFixed(4)}`,
        `Step 9: Compute Mu = Ø × As × fy × (d-a/2) = ${phi.toFixed(4)} × ${inputs.As} × ${inputs.fy} × (${inputs.d}-${a.toFixed(2)}/2) = ${Mn.toFixed(2)} kN·m`
      ];
      
      finalAnswer = `The beam is Singly Reinforced with a moment capacity of ${Mn.toFixed(2)} kN·m.`;
    } else {
      // For Doubly Reinforced Beams
      // Step 6: Compute As1
      const as1 = asmax;
      const as2 = inputs.As - as1;
      
      // Step 7: Compute a, c, fs, f's
      const a = (as1 * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      const c = a / beta;
      
      const fs = 600 * ((inputs.d - c) / c);
      const fprime = 600 * ((c - inputs.dprime) / c);
      const fprimeStatus = fprime >= inputs.fy ? "f's ≥ fy, compression steel yields" : "f's < fy, compression steel does not yield";
      
      // Step 8: Compute reduction factor Ø
      phi = 0.65 + 0.25 * ((fs - inputs.fy) / (600 - inputs.fy));
      phi = Math.min(Math.max(phi, 0.65), 0.9); // Ensure phi is between 0.65 and 0.9
      
      // Step 9: Compute Mu
      const effectiveFprime = Math.min(fprime, inputs.fy);
      Mn = (phi * (as1 * inputs.fy * (inputs.d - a/2) + inputs.Asprime * effectiveFprime * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
      
      solutions = [
        ...solutions,
        `Step 6: Compute As1 = Asmax = ${as1.toFixed(2)} mm²`,
        `         Compute As2 = As - As1 = ${inputs.As} - ${as1.toFixed(2)} = ${as2.toFixed(2)} mm²`,
        `Step 7: Compute a = (As1 × fy)/(0.85 × f'c × b) = (${as1.toFixed(2)} × ${inputs.fy})/(0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`,
        `         Compute c = a/β = ${a.toFixed(2)}/${beta.toFixed(4)} = ${c.toFixed(2)} mm`,
        `         Compute fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${c.toFixed(2)})/${c.toFixed(2)}) = ${fs.toFixed(2)} MPa`,
        `         Compute f's = 600 × ((c-d')/c) = 600 × ((${c.toFixed(2)}-${inputs.dprime})/${c.toFixed(2)}) = ${fprime.toFixed(2)} MPa`,
        `         ${fprimeStatus}`,
        `Step 8: Compute reduction factor Ø = ${phi.toFixed(4)}`,
        `Step 9: Compute Mu = Ø × (As1 × fy × (d-a/2) + A's × f's × (d-d')) = ${Mn.toFixed(2)} kN·m`
      ];
      
      finalAnswer = `The beam is Doubly Reinforced with a moment capacity of ${Mn.toFixed(2)} kN·m.`;
    }
    
    // Create the results object
    const analysisResults: AnalysisResults = {
      beta,
      phi,
      Mn,
      beamType,
      solutions,
      finalAnswer
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
