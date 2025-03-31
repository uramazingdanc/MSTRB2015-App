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
      // Step 6: Compute a and c using As
      const a = (inputs.As * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      const c = a / beta;
      
      // Step 7: Compute fs - the strain in the steel
      const fs = 600 * ((inputs.d - c) / c);
      
      solutions.push(`Step 6: Compute a = (As × fy)/(0.85 × f'c × b) = (${inputs.As} × ${inputs.fy})/(0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`);
      solutions.push(`         Compute c = a/β = ${a.toFixed(2)}/${beta.toFixed(4)} = ${c.toFixed(2)} mm`);
      solutions.push(`Step 7: Compute fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${c.toFixed(2)})/${c.toFixed(2)}) = ${fs.toFixed(2)} MPa`);
      
      if (fs >= inputs.fy) {
        // If steel yields
        solutions.push(`         Since fs (${fs.toFixed(2)}) ≥ fy (${inputs.fy}), the steel yields`);
        
        // Step 8: Compute reduction factor Ø - Updated with new criteria
        if (fs >= 1000) {
          phi = 0.9;
          solutions.push(`Step 8: Since fs (${fs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
        } else if (fs >= inputs.fy && fs < 1000) {
          phi = 0.65 + 0.25 * ((fs - inputs.fy) / (1000 - inputs.fy));
          solutions.push(`Step 8: Since ${inputs.fy} ≤ fs (${fs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25 × ((${fs.toFixed(2)} - ${inputs.fy})/(1000 - ${inputs.fy})) = ${phi.toFixed(4)}`);
        } else {
          phi = 0.65;
          solutions.push(`Step 8: Since fs (${fs.toFixed(2)}) < fy (${inputs.fy}), Ø = 0.65`);
        }
        
        // Step 9: Compute Mu
        Mn = phi * inputs.As * inputs.fy * (inputs.d - a/2) / 1000000; // Convert to kN·m
        solutions.push(`Step 9: Compute Mu = Ø × As × fy × (d-a/2) = ${phi.toFixed(4)} × ${inputs.As} × ${inputs.fy} × (${inputs.d}-${a.toFixed(2)}/2) = ${Mn.toFixed(2)} kN·m`);
      } else {
        // If steel does not yield (additional steps for non-yielding singly reinforced beam)
        solutions.push(`         Since fs (${fs.toFixed(2)}) < fy (${inputs.fy}), the steel does not yield`);
        
        // Use quadratic formula to find 'c'
        solutions.push(`Step 8: Determine "c" using the Quadratic Formula:`);
        
        // Calculate quadratic formula components for singly reinforced non-yielding
        const A = 1.7 * inputs.fc * inputs.b;
        const B = -600 * inputs.As;
        const C = 2040 * inputs.fc * inputs.b * inputs.As * inputs.d;
        
        const discriminant = (600 * inputs.As) ** 2 + C;
        
        const c1 = (B + Math.sqrt(discriminant)) / A;
        const c2 = (B - Math.sqrt(discriminant)) / A;
        
        solutions.push(`         c₁ = (-600As + √(360000(As)² + 2040·fc'·b·As·d)) / (1.7·fc'·b)`);
        solutions.push(`         c₁ = (-600·${inputs.As} + √(360000·(${inputs.As})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        solutions.push(`         c₁ = ${c1.toFixed(2)} mm`);
        
        solutions.push(`         c₂ = (-600As - √(360000(As)² + 2040·fc'·b·As·d)) / (1.7·fc'·b)`);
        solutions.push(`         c₂ = (-600·${inputs.As} - √(360000·(${inputs.As})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        solutions.push(`         c₂ = ${c2.toFixed(2)} mm`);
        
        // Select highest value of c that doesn't exceed beam height
        const selectedC = Math.max(c1, c2) <= inputs.d ? Math.max(c1, c2) : Math.min(inputs.d, Math.max(c1, c2));
        solutions.push(`         Select the highest value of c (${Math.max(c1, c2).toFixed(2)}) that doesn't exceed beam height (${inputs.d})`);
        solutions.push(`         Selected c = ${selectedC.toFixed(2)} mm`);
        
        // Re-calculate fs with the selected 'c'
        const updatedFs = 600 * ((inputs.d - selectedC) / selectedC);
        solutions.push(`Step 9: Compute fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${selectedC.toFixed(2)})/${selectedC.toFixed(2)}) = ${updatedFs.toFixed(2)} MPa`);
        
        // Calculate 'a' (a = β × c)
        const updatedA = beta * selectedC;
        solutions.push(`Step 10: Calculate a = β × c = ${beta.toFixed(4)} × ${selectedC.toFixed(2)} = ${updatedA.toFixed(2)} mm`);
        
        // Set Ø = 0.65 (compression-controlled)
        phi = 0.65;
        solutions.push(`Step 11: Set Ø = 0.65 (compression-controlled)`);
        
        // Calculate Mu
        Mn = (phi * inputs.As * updatedFs * (inputs.d - updatedA/2)) / 1000000; // Convert to kN·m
        solutions.push(`Step 12: Calculate Mu = Ø × As × fs × (d-a/2) × (1/10^6)`);
        solutions.push(`         Mu = 0.65 × ${inputs.As} × ${updatedFs.toFixed(2)} × (${inputs.d}-${updatedA.toFixed(2)}/2) × (1/10^6)`);
        solutions.push(`         Mu = ${Mn.toFixed(2)} kN·m`);
      }
      
      finalAnswer = `The beam is Singly Reinforced with a moment capacity of ${Mn.toFixed(2)} kN·m.`;
    } else {
      // For Doubly Reinforced Beams - Updated approach with more detailed steps
      
      // Step 5.1: Assume compression steel yields and solve for As1
      const As2 = inputs.Asprime;
      const As1 = inputs.As - As2;
      
      // Step 5.2: Solve for 'a'
      const a = (As1 * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      
      // Step 5.3: Solve for 'c'
      const c = a / beta;
      
      // Step 5.4: Solve stresses fs' and fs
      const fprime = 600 * ((c - inputs.dprime) / c); // Compression steel stress
      const fs = 600 * ((inputs.d - c) / c); // Tension steel stress
      
      solutions.push(`Step 5.1: Assume compression steel yields and solve for As1`);
      solutions.push(`         As2 = A's = ${inputs.Asprime} mm²`);
      solutions.push(`         As1 = As - As2 = ${inputs.As} - ${inputs.Asprime} = ${As1.toFixed(2)} mm²`);
      
      solutions.push(`Step 5.2: Solve for 'a' = (As1 × fy)/(0.85 × f'c × b) = (${As1.toFixed(2)} × ${inputs.fy})/(0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`);
      
      solutions.push(`Step 5.3: Solve for 'c' = a/β = ${a.toFixed(2)}/${beta.toFixed(4)} = ${c.toFixed(2)} mm`);
      
      solutions.push(`Step 5.4: Solve stresses fs' and fs`);
      solutions.push(`         fs' = 600 × ((c-d')/c) = 600 × ((${c.toFixed(2)}-${inputs.dprime})/${c.toFixed(2)}) = ${fprime.toFixed(2)} MPa`);
      solutions.push(`         fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${c.toFixed(2)})/${c.toFixed(2)}) = ${fs.toFixed(2)} MPa`);
      
      // Step 5.5: Compare fs with fy
      if (fs >= inputs.fy) {
        solutions.push(`Step 5.5: Compare fs with fy: ${fs.toFixed(2)} ≥ ${inputs.fy}, tension steel yields`);
        
        // Step 5.6: Compare fs' with fy
        if (fprime >= inputs.fy) {
          solutions.push(`Step 5.6: Compare fs' with fy: ${fprime.toFixed(2)} ≥ ${inputs.fy}, compression steel yields`);
          
          // Step 5.7: Determine reduction factor (Ø)
          if (fs >= 1000) {
            phi = 0.9;
            solutions.push(`Step 5.7: Since fs (${fs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
          } else if (fs >= inputs.fy && fs < 1000) {
            phi = 0.65 + 0.25 * ((fs - inputs.fy) / (1000 - inputs.fy));
            solutions.push(`Step 5.7: Since ${inputs.fy} ≤ fs (${fs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25 × ((${fs.toFixed(2)} - ${inputs.fy})/(1000 - ${inputs.fy})) = ${phi.toFixed(4)}`);
          } else {
            phi = 0.65;
            solutions.push(`Step 5.7: Since fs (${fs.toFixed(2)}) < fy (${inputs.fy}), Ø = 0.65`);
          }
          
          // Step 5.8: Calculate moment Mu
          Mn = (phi * (As1 * inputs.fy * (inputs.d - a/2) + As2 * inputs.fy * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
          solutions.push(`Step 5.8: Calculate Mu = [Ø × (As1 × fy × (d-a/2) + As2 × fy × (d-d'))]/10^6`);
          solutions.push(`         Mu = [${phi.toFixed(4)} × (${As1.toFixed(2)} × ${inputs.fy} × (${inputs.d}-${a.toFixed(2)}/2) + ${As2} × ${inputs.fy} × (${inputs.d}-${inputs.dprime}))]/10^6`);
          solutions.push(`         Mu = ${Mn.toFixed(2)} kN·m`);
        } else {
          // Compression steel does not yield
          solutions.push(`Step 5.6: Compare fs' with fy: ${fprime.toFixed(2)} < ${inputs.fy}, compression steel does not yield`);
          
          // Steps 5.9 - 5.12 (for non-yielding compression steel)
          solutions.push(`Step 5.9: Recalculate 'c' using quadratic formula:`);
          
          // Calculate quadratic formula components
          const A = 1.7 * inputs.fc * inputs.b;
          const B = -(600 * inputs.Asprime - inputs.As * inputs.fy);
          const C = 2040 * inputs.fc * inputs.b * inputs.Asprime * inputs.dprime;
          
          const discriminant = Math.pow((600 * inputs.Asprime - inputs.As * inputs.fy), 2) + C;
          
          const c1 = (B + Math.sqrt(discriminant)) / A;
          const c2 = (B - Math.sqrt(discriminant)) / A;
          
          solutions.push(`         c₁ = (-(600A's - Asfy) + √((600A's - Asfy)² + 2040fc'bA's'd')) / (1.7fc'b)`);
          solutions.push(`         c₁ = (-(600·${inputs.Asprime} - ${inputs.As}·${inputs.fy}) + √((600·${inputs.Asprime} - ${inputs.As}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.Asprime}·${inputs.dprime})) / (1.7·${inputs.fc}·${inputs.b})`);
          solutions.push(`         c₁ = ${c1.toFixed(2)} mm`);
          
          solutions.push(`         c₂ = (-(600A's - Asfy) - √((600A's - Asfy)² + 2040fc'bA's'd')) / (1.7fc'b)`);
          solutions.push(`         c₂ = (-(600·${inputs.Asprime} - ${inputs.As}·${inputs.fy}) - √((600·${inputs.Asprime} - ${inputs.As}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.Asprime}·${inputs.dprime})) / (1.7·${inputs.fc}·${inputs.b})`);
          solutions.push(`         c₂ = ${c2.toFixed(2)} mm`);
          
          // Select highest value of c that doesn't exceed beam height
          const selectedC = Math.max(c1, c2) <= inputs.d ? Math.max(c1, c2) : Math.min(inputs.d, Math.max(c1, c2));
          solutions.push(`         Select the highest value of c (${Math.max(c1, c2).toFixed(2)}) that doesn't exceed beam height (${inputs.d})`);
          solutions.push(`         Selected c = ${selectedC.toFixed(2)} mm`);
          
          // Step 5.10: Calculate 'a' and recalculate fs' and fs
          const updatedA = beta * selectedC;
          const updatedFprime = 600 * ((selectedC - inputs.dprime) / selectedC);
          const updatedFs = 600 * ((inputs.d - selectedC) / selectedC);
          
          solutions.push(`Step 5.10: Calculate 'a' = β × c = ${beta.toFixed(4)} × ${selectedC.toFixed(2)} = ${updatedA.toFixed(2)} mm`);
          solutions.push(`         Recalculate fs' = 600 × ((c-d')/c) = 600 × ((${selectedC.toFixed(2)}-${inputs.dprime})/${selectedC.toFixed(2)}) = ${updatedFprime.toFixed(2)} MPa`);
          solutions.push(`         Recalculate fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${selectedC.toFixed(2)})/${selectedC.toFixed(2)}) = ${updatedFs.toFixed(2)} MPa`);
          
          // Step 5.11: Determine reduction factor (Ø) - same logic as 5.7
          if (updatedFs >= 1000) {
            phi = 0.9;
            solutions.push(`Step 5.11: Since fs (${updatedFs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
          } else if (updatedFs >= inputs.fy && updatedFs < 1000) {
            phi = 0.65 + 0.25 * ((updatedFs - inputs.fy) / (1000 - inputs.fy));
            solutions.push(`Step 5.11: Since ${inputs.fy} ≤ fs (${updatedFs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25 × ((${updatedFs.toFixed(2)} - ${inputs.fy})/(1000 - ${inputs.fy})) = ${phi.toFixed(4)}`);
          } else {
            phi = 0.65;
            solutions.push(`Step 5.11: Since fs (${updatedFs.toFixed(2)}) < fy (${inputs.fy}), Ø = 0.65`);
          }
          
          // Step 5.12: Calculate moment Mu using formula with actual fs'
          Mn = (phi * (0.85 * inputs.fc * updatedA * inputs.b * (inputs.d - updatedA/2) + inputs.Asprime * updatedFprime * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
          solutions.push(`Step 5.12: Calculate Mu = [Ø × (0.85 × fc' × a × b × (d-a/2) + As' × fs' × (d-d'))]/10^6`);
          solutions.push(`         Mu = [${phi.toFixed(4)} × (0.85 × ${inputs.fc} × ${updatedA.toFixed(2)} × ${inputs.b} × (${inputs.d}-${updatedA.toFixed(2)}/2) + ${inputs.Asprime} × ${updatedFprime.toFixed(2)} × (${inputs.d}-${inputs.dprime}))]/10^6`);
          solutions.push(`         Mu = ${Mn.toFixed(2)} kN·m`);
        }
      } else {
        // Tension steel does not yield - Step 5.13
        solutions.push(`Step 5.5: Compare fs with fy: ${fs.toFixed(2)} < ${inputs.fy}, tension steel does not yield`);
        solutions.push(`Step 5.13: Since tension steel does not yield, recalculate 'c' using quadratic formula:`);
        
        // Calculate quadratic formula components for non-yielding tension steel
        const A = 1.7 * inputs.fc * inputs.b;
        const B = -(600 * inputs.As + inputs.Asprime * inputs.fy);
        const C = 2040 * inputs.fc * inputs.b * inputs.As * inputs.d;
        
        const discriminant = Math.pow((600 * inputs.As + inputs.Asprime * inputs.fy), 2) + C;
        
        const c1 = (B + Math.sqrt(discriminant)) / A;
        const c2 = (B - Math.sqrt(discriminant)) / A;
        
        solutions.push(`         c₁ = (-(600As + A'sfy) + √((600As + A'sfy)² + 2040fc'bAsd)) / (1.7fc'b)`);
        solutions.push(`         c₁ = (-(600·${inputs.As} + ${inputs.Asprime}·${inputs.fy}) + √((600·${inputs.As} + ${inputs.Asprime}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        solutions.push(`         c₁ = ${c1.toFixed(2)} mm`);
        
        solutions.push(`         c₂ = (-(600As + A'sfy) - √((600As + A'sfy)² + 2040fc'bAsd)) / (1.7fc'b)`);
        solutions.push(`         c₂ = (-(600·${inputs.As} + ${inputs.Asprime}·${inputs.fy}) - √((600·${inputs.As} + ${inputs.Asprime}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        solutions.push(`         c₂ = ${c2.toFixed(2)} mm`);
        
        // Select highest value of c that doesn't exceed beam height
        const selectedC = Math.max(c1, c2) <= inputs.d ? Math.max(c1, c2) : Math.min(inputs.d, Math.max(c1, c2));
        solutions.push(`         Select the highest value of c (${Math.max(c1, c2).toFixed(2)}) that doesn't exceed beam height (${inputs.d})`);
        solutions.push(`         Selected c = ${selectedC.toFixed(2)} mm`);
        
        // Recalculate fs' and fs with the selected 'c'
        const updatedFprime = 600 * ((selectedC - inputs.dprime) / selectedC);
        const updatedFs = 600 * ((inputs.d - selectedC) / selectedC);
        solutions.push(`         Calculate fs' = 600 × ((c-d')/c) = 600 × ((${selectedC.toFixed(2)}-${inputs.dprime})/${selectedC.toFixed(2)}) = ${updatedFprime.toFixed(2)} MPa`);
        solutions.push(`         Calculate fs = 600 × ((d-c)/c) = 600 × ((${inputs.d}-${selectedC.toFixed(2)})/${selectedC.toFixed(2)}) = ${updatedFs.toFixed(2)} MPa`);
        
        // Determine Ø factor (same criteria as Step 5.7)
        if (updatedFs >= 1000) {
          phi = 0.9;
          solutions.push(`         Since fs (${updatedFs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
        } else if (updatedFs >= inputs.fy && updatedFs < 1000) {
          phi = 0.65 + 0.25 * ((updatedFs - inputs.fy) / (1000 - inputs.fy));
          solutions.push(`         Since ${inputs.fy} ≤ fs (${updatedFs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25 × ((${updatedFs.toFixed(2)} - ${inputs.fy})/(1000 - ${inputs.fy})) = ${phi.toFixed(4)}`);
        } else {
          phi = 0.65;
          solutions.push(`         Since fs (${updatedFs.toFixed(2)}) < fy (${inputs.fy}), Ø = 0.65 (compression-controlled)`);
        }
        
        // Calculate 'a' (a = β × c)
        const updatedA = beta * selectedC;
        solutions.push(`         Calculate 'a' = β × c = ${beta.toFixed(4)} × ${selectedC.toFixed(2)} = ${updatedA.toFixed(2)} mm`);
        
        // Calculate moment Mu
        Mn = (phi * (0.85 * inputs.fc * updatedA * inputs.b * (inputs.d - updatedA/2) + inputs.Asprime * inputs.fy * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
        solutions.push(`         Calculate Mu = [Ø × (0.85·fc'·a·b·(d-a/2) + As'·fy·(d-d'))]/10^6`);
        solutions.push(`         Mu = [${phi.toFixed(4)} × (0.85 × ${inputs.fc} × ${updatedA.toFixed(2)} × ${inputs.b} × (${inputs.d}-${updatedA.toFixed(2)}/2) + ${inputs.Asprime} × ${inputs.fy} × (${inputs.d}-${inputs.dprime}))]/10^6`);
        solutions.push(`         Mu = ${Mn.toFixed(2)} kN·m`);
      }
      
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
