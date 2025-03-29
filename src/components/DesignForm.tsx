
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SolutionsDisplay } from "./SolutionsDisplay";
import { CircuitBackground } from "./CircuitBackground";
import { toast } from "sonner";

interface DesignInputs {
  fc: number;
  fy: number;
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

    // Step 1: Determine Beta
    const beta = inputs.fc <= 28 ? 0.85 : 0.85 - (0.05/7) * (inputs.fc - 28);
    
    // Calculate Pmax (reinforcement ratio)
    const pmax = (3/7) * ((0.85 * inputs.fc * beta) / inputs.fy);
    
    // Step 2: Calculate phi (reduction factor)
    const phi = 0.65 + 0.25 * (800 - inputs.fy) / (1000 - inputs.fy);
    
    // Calculate Mnmax (maximum nominal moment capacity)
    const Mnmax = (51/140) * beta * inputs.fc * inputs.b * Math.pow(inputs.d, 2) * (1 - 3/14 * beta) / 1000000;
    
    // Calculate ØMnmax (maximum design moment capacity)
    const phiMnmax = phi * Mnmax;
    
    // Step 3: Determine beam type - Compare MU with ØMnmax
    const beamType = inputs.MU > phiMnmax ? 'Doubly Reinforced' : 'Singly Reinforced';
    
    // Initialize variables for step-by-step solutions
    let solutions: string[] = [
      `Step 1: Determine Beta (β)`,
      `β = ${inputs.fc <= 28 ? "0.85" : `0.85 - (0.05/7) × (${inputs.fc} - 28)`} = ${beta.toFixed(4)}`,
      `Pmax = (3/7) × ((0.85 × ${inputs.fc} × ${beta.toFixed(4)}) / ${inputs.fy}) = ${pmax.toFixed(6)}`,
      `Step 2: Compute Mnmax and Reduction Factor (φ)`,
      `Mnmax = (51/140) × ${beta.toFixed(4)} × ${inputs.fc} × ${inputs.b} × ${inputs.d}² × (1 - 3/14 × ${beta.toFixed(4)}) × (1/1000²)`,
      `Mnmax = ${Mnmax.toFixed(2)} kN·m`,
      `φ = 0.65 + 0.25 × (800 - ${inputs.fy}) / (1000 - ${inputs.fy}) = ${phi.toFixed(4)}`,
      `φMnmax = ${phi.toFixed(4)} × ${Mnmax.toFixed(2)} = ${phiMnmax.toFixed(2)} kN·m`,
      `Step 3: Identify Beam Type`,
      `Mu = ${inputs.MU} kN·m`,
      `Since ${inputs.MU} ${inputs.MU <= phiMnmax ? "≤" : ">"} ${phiMnmax.toFixed(2)} kN·m, this is a ${beamType}`
    ];

    let As = 0;
    let Asprime = 0;
    
    if (beamType === 'Singly Reinforced') {
      // Calculate ØMtn for tension-controlled section
      const phiMtn = (459/1600) * beta * inputs.fc * inputs.b * Math.pow(inputs.d, 2) * (1 - 3/16 * beta) / 1000000;
      
      solutions.push(`Step 4: Compute ØMtn for tension-controlled section`);
      solutions.push(`ØMtn = (459/1600) × ${beta.toFixed(4)} × ${inputs.fc} × ${inputs.b} × ${inputs.d}² × (1 - 3/16 × ${beta.toFixed(4)}) × (1/1000²)`);
      solutions.push(`ØMtn = ${phiMtn.toFixed(2)} kN·m`);
      
      if (inputs.MU < phiMtn) {
        // Tension Controlled Section
        solutions.push(`Since Mu (${inputs.MU} kN·m) < ØMtn (${phiMtn.toFixed(2)} kN·m), the beam is Tension Controlled`);
        solutions.push(`For Tension Controlled sections, φ = 0.9`);
        
        const phi_tension = 0.9;
        // Calculate Rn
        const Rn = (inputs.MU / (phi_tension * inputs.b * Math.pow(inputs.d, 2))) * 1000000;
        
        solutions.push(`Step 5: Compute Rn`);
        solutions.push(`Rn = (${inputs.MU} × 10⁶) / (0.9 × ${inputs.b} × ${inputs.d}²) = ${Rn.toFixed(4)} MPa`);
        
        // Calculate reinforcement ratio
        const rho = (0.85 * inputs.fc / inputs.fy) * (1 - Math.sqrt(1 - (2 * Rn) / (0.85 * inputs.fc)));
        
        solutions.push(`Step 6: Compute Reinforcement Ratio (ρ)`);
        solutions.push(`ρ = (0.85 × ${inputs.fc} / ${inputs.fy}) × (1 - √(1 - (2 × ${Rn.toFixed(4)}) / (0.85 × ${inputs.fc})))`);
        solutions.push(`ρ = ${rho.toFixed(6)}`);
        
        // Calculate required steel area
        As = rho * inputs.b * inputs.d;
        
        solutions.push(`Step 7: Compute As`);
        solutions.push(`As = ρ × b × d = ${rho.toFixed(6)} × ${inputs.b} × ${inputs.d} = ${As.toFixed(2)} mm²`);
      } else {
        // Transition Region
        solutions.push(`Since Mu (${inputs.MU} kN·m) > ØMtn (${phiMtn.toFixed(2)} kN·m), the beam is in the Transition Region`);
        
        // Approximate solution for neutral axis depth (c)
        const k = inputs.MU * 1000000 / (0.85 * inputs.fc * inputs.b * Math.pow(inputs.d, 2));
        const c_approx = (1 - Math.sqrt(1 - 2 * k)) * inputs.d;
        
        solutions.push(`Step 5: Approximate solution for neutral axis depth (c)`);
        solutions.push(`c ≈ ${c_approx.toFixed(2)} mm`);
        
        // Calculate the depth of equivalent stress block
        const a = beta * c_approx;
        
        solutions.push(`Step 6: Compute depth of equivalent stress block (a)`);
        solutions.push(`a = β × c = ${beta.toFixed(4)} × ${c_approx.toFixed(2)} = ${a.toFixed(2)} mm`);
        
        // Calculate steel area
        As = (0.85 * inputs.fc * a * inputs.b) / inputs.fy;
        
        solutions.push(`Step 7: Compute As`);
        solutions.push(`As = (0.85 × ${inputs.fc} × ${a.toFixed(2)} × ${inputs.b}) / ${inputs.fy} = ${As.toFixed(2)} mm²`);
      }
    } else {
      // Doubly Reinforced Beam
      
      // Step 4: Compute As1
      const As1 = pmax * inputs.b * inputs.d;
      
      solutions.push(`Step 4: Compute As1 (for balanced section)`);
      solutions.push(`As1 = Pmax × b × d = ${pmax.toFixed(6)} × ${inputs.b} × ${inputs.d} = ${As1.toFixed(2)} mm²`);
      
      // Step 5: Compute ØMn2 (additional moment to be resisted by compression steel)
      const phiMn2 = inputs.MU - phiMnmax;
      
      solutions.push(`Step 5: Compute ØMn2 (additional moment)`);
      solutions.push(`ØMn2 = Mu - φMnmax = ${inputs.MU} - ${phiMnmax.toFixed(2)} = ${phiMn2.toFixed(2)} kN·m`);
      
      // Step 6: Compute As2 (additional tension steel)
      const As2 = (phiMn2 * 1000000) / (inputs.fy * (inputs.d - inputs.dprime) * phi);
      
      solutions.push(`Step 6: Compute As2 (additional tension steel)`);
      solutions.push(`As2 = (${phiMn2.toFixed(2)} × 10⁶) / (${inputs.fy} × (${inputs.d} - ${inputs.dprime}) × ${phi.toFixed(4)})`);
      solutions.push(`As2 = ${As2.toFixed(2)} mm²`);
      
      // Step 7: Compute a and c using As1 (not As)
      const a = (As1 * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      const c = a / beta;
      
      solutions.push(`Step 7: Compute a and c using As1`);
      solutions.push(`a = (As1 × fy) / (0.85 × f'c × b) = (${As1.toFixed(2)} × ${inputs.fy}) / (0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`);
      solutions.push(`c = a / β = ${a.toFixed(2)} / ${beta.toFixed(4)} = ${c.toFixed(2)} mm`);
      
      // Step 8: Compute f's (stress in compression steel)
      const fs_prime = 600 * ((c - inputs.dprime) / c);
      
      solutions.push(`Step 8: Compute f's (stress in compression steel)`);
      solutions.push(`f's = 600 × ((${c.toFixed(2)} - ${inputs.dprime}) / ${c.toFixed(2)}) = ${fs_prime.toFixed(2)} MPa`);
      
      if (fs_prime >= inputs.fy) {
        // Compression Bar Yields
        solutions.push(`Since f's (${fs_prime.toFixed(2)} MPa) ≥ fy (${inputs.fy} MPa), the compression bar yields`);
        
        // As = As1 + As2
        As = As1 + As2;
        Asprime = As2;
        
        solutions.push(`Step 8.1: Compute As and A's`);
        solutions.push(`As = As1 + As2 = ${As1.toFixed(2)} + ${As2.toFixed(2)} = ${As.toFixed(2)} mm²`);
        solutions.push(`A's = As2 = ${As2.toFixed(2)} mm²`);
      } else {
        // Compression Bar Does Not Yield
        solutions.push(`Since f's (${fs_prime.toFixed(2)} MPa) < fy (${inputs.fy} MPa), the compression bar does not yield`);
        
        Asprime = (As2 * inputs.fy) / fs_prime;
        // As = As1 + As2
        As = As1 + As2;
        
        solutions.push(`Step 8.2: Compute A's and As`);
        solutions.push(`A's = (As2 × fy) / f's = (${As2.toFixed(2)} × ${inputs.fy}) / ${fs_prime.toFixed(2)} = ${Asprime.toFixed(2)} mm²`);
        solutions.push(`As = As1 + As2 = ${As1.toFixed(2)} + ${As2.toFixed(2)} = ${As.toFixed(2)} mm²`);
      }
    }
    
    // Create the final answer
    let finalAnswer = `The beam requires ${As.toFixed(0)} mm² of tension reinforcement`;
    if (beamType === 'Doubly Reinforced') {
      finalAnswer += ` and ${Asprime.toFixed(0)} mm² of compression reinforcement`;
    }
    finalAnswer += `.`;
    
    // Create the results object
    const designResults: DesignResults = {
      beta,
      phi,
      Mnmax,
      beamType,
      As,
      Asprime,
      solutions,
      finalAnswer
    };
    
    setResults(designResults);
    setShowResults(true);
    
    toast.success("Design calculations completed successfully");
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
              name="MU"
              label="MU"
              unit="kN·m"
              value={inputs.MU}
              onChange={handleChange}
              tooltip="Ultimate moment (If MD and ML are provided, use Mu = 1.2DL + 1.6LL)"
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
