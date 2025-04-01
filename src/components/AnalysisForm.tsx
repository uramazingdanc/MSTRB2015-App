
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
    
    // Initialize solutions array
    let solutions: string[] = [];
    
    // Step 1: Compute Cmax
    const cmax = (3 * inputs.d) / 7;
    solutions.push(`Step 1: Compute Cmax = 3d/7 = 3(${inputs.d})/7 = ${cmax.toFixed(2)} mm`);
    
    // Step 2: Determine beta based on conditions
    let beta: number;
    if (inputs.fc >= 17 && inputs.fc <= 28) {
      beta = 0.85;
      solutions.push(`Step 2: Since 17 ≤ fc'(${inputs.fc}) ≤ 28, β = 0.85`);
    } else if (inputs.fc > 28 && inputs.fc < 55) {
      beta = 0.85 - (0.05/7) * (inputs.fc - 28);
      solutions.push(`Step 2: Since 28 < fc'(${inputs.fc}) < 55, β = 0.85 - (0.05/7)(${inputs.fc} - 28) = ${beta.toFixed(4)}`);
    } else {
      beta = 0.65;
      solutions.push(`Step 2: Since fc'(${inputs.fc}) > 55, β = 0.65`);
    }
    
    // Step 3: Compute Amax
    const amax = beta * cmax;
    solutions.push(`Step 3: Compute Amax = β × Cmax = ${beta.toFixed(4)} × ${cmax.toFixed(2)} = ${amax.toFixed(2)} mm`);
    
    // Step 4: Compute Asmax
    const asmax = (0.85 * inputs.fc * amax * inputs.b) / inputs.fy;
    solutions.push(`Step 4: Compute Asmax = (0.85 × fc' × Amax × b)/fy = (0.85 × ${inputs.fc} × ${amax.toFixed(2)} × ${inputs.b})/${inputs.fy} = ${asmax.toFixed(2)} mm²`);
    
    // Step 5: Compare Asmax and As to determine beam type
    const beamType = asmax > inputs.As ? 'Singly Reinforced' : 'Doubly Reinforced';
    solutions.push(`Step 5: Compare Asmax with As: ${asmax.toFixed(2)} ${asmax > inputs.As ? '>' : '<'} ${inputs.As} → ${beamType}`);
    
    let phi: number;
    let Mn: number;
    
    if (beamType === 'Singly Reinforced') {
      // For Singly Reinforced Beams
      solutions.push(`\nSingly Reinforced Beam Analysis:`);
      
      // Step 5.1: Assume steel yields and compute 'a'
      const a = (inputs.As * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      solutions.push(`Step 5.1: Compute a = (As × fy)/(0.85 × fc' × b) = (${inputs.As} × ${inputs.fy})/(0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`);
      
      // Step 5.2: Compute 'c'
      const c = a / beta;
      solutions.push(`Step 5.2: Compute c = a/β = ${a.toFixed(2)}/${beta.toFixed(4)} = ${c.toFixed(2)} mm`);
      
      // Step 5.3: Compute fs
      const fs = 600 * ((inputs.d - c) / c);
      solutions.push(`Step 5.3: Compute fs = 600((d-c)/c) = 600((${inputs.d}-${c.toFixed(2)})/${c.toFixed(2)}) = ${fs.toFixed(2)} MPa`);
      
      // Step 5.4: Compare fs with fy
      const steelYields = fs >= inputs.fy;
      solutions.push(`Step 5.4: Compare fs with fy: ${fs.toFixed(2)} ${steelYields ? '≥' : '<'} ${inputs.fy} → Steel ${steelYields ? 'Yields' : 'Does Not Yield'}`);
      
      if (steelYields) {
        // Step 5.5-5.6: If steel yields
        solutions.push(`\nStep 5.5: Steel Yields - Determine Ø (reduction factor):`);
        
        // Determine reduction factor based on fs
        if (fs >= 1000) {
          phi = 0.90;
          solutions.push(`Since fs(${fs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
        } else if (fs >= inputs.fy && fs < 1000) {
          phi = 0.65 + 0.25 * ((fs - inputs.fy) / (1000 - inputs.fy));
          solutions.push(`Since ${inputs.fy} ≤ fs(${fs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25((${fs.toFixed(2)}-${inputs.fy})/(1000-${inputs.fy})) = ${phi.toFixed(4)}`);
        } else {
          phi = 0.65;
          solutions.push(`Since fs(${fs.toFixed(2)}) < fy(${inputs.fy}), Ø = 0.65`);
        }
        
        // Step 5.6: Compute Mu
        Mn = (phi * inputs.As * inputs.fy * (inputs.d - a/2)) / 1000000; // Convert to kN·m
        solutions.push(`\nStep 5.6: Compute Mu = Ø × As × fy × (d-a/2) / 10^6`);
        solutions.push(`Mu = ${phi.toFixed(4)} × ${inputs.As} × ${inputs.fy} × (${inputs.d}-${a.toFixed(2)}/2) / 10^6 = ${Mn.toFixed(2)} kN·m`);
      } else {
        // Step 5.7-5.11: If steel does not yield
        solutions.push(`\nStep 5.7: Steel Does Not Yield - Determine c using quadratic formula:`);
        
        // Step 5.7: Calculate c using quadratic formula for non-yielding steel
        solutions.push(`Solve quadratic equation: 0.85 × fc' × β × c × b = As × [600((d-c)/c)]`);
        
        // Calculate c using quadratic formula
        solutions.push(`c₁ = (-600As + √(360000(As)² + 2040·fc'·b·As·d)) / (1.7·fc'·b)`);
        solutions.push(`c₁ = (-600·${inputs.As} + √(360000·(${inputs.As})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        
        const A = 1.7 * inputs.fc * inputs.b;
        const B = -600 * inputs.As;
        const C = 2040 * inputs.fc * inputs.b * inputs.As * inputs.d;
        
        const discriminant = Math.pow(B, 2) - 4 * A * (-C);
        
        if (discriminant < 0) {
          toast.error("No valid solutions found for this beam configuration");
          return;
        }
        
        const c1 = (-B + Math.sqrt(discriminant)) / (2 * A);
        const c2 = (-B - Math.sqrt(discriminant)) / (2 * A);
        
        solutions.push(`c₁ = ${c1.toFixed(2)} mm`);
        
        solutions.push(`c₂ = (-600As - √(360000(As)² + 2040·fc'·b·As·d)) / (1.7·fc'·b)`);
        solutions.push(`c₂ = (-600·${inputs.As} - √(360000·(${inputs.As})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        solutions.push(`c₂ = ${c2.toFixed(2)} mm`);
        
        // Select the highest value of c that doesn't exceed beam height
        let selectedC = Math.max(c1, c2);
        if (selectedC > inputs.d) {
          selectedC = Math.min(inputs.d, Math.max(c1, c2));
        }
        
        solutions.push(`Select the highest value of c that doesn't exceed beam height (${inputs.d} mm)`);
        solutions.push(`Selected c = ${selectedC.toFixed(2)} mm`);
        
        // Step 5.8: Compute fs with the selected c
        const updatedFs = 600 * ((inputs.d - selectedC) / selectedC);
        solutions.push(`\nStep 5.8: Compute fs = 600((d-c)/c) = 600((${inputs.d}-${selectedC.toFixed(2)})/${selectedC.toFixed(2)}) = ${updatedFs.toFixed(2)} MPa`);
        
        // Step 5.9: Compute a with the selected c
        const updatedA = beta * selectedC;
        solutions.push(`\nStep 5.9: Compute a = β × c = ${beta.toFixed(4)} × ${selectedC.toFixed(2)} = ${updatedA.toFixed(2)} mm`);
        
        // Step 5.10: Determine reduction factor based on fs
        solutions.push(`\nStep 5.10: Determine Ø (reduction factor):`);
        
        if (updatedFs >= 1000) {
          phi = 0.90;
          solutions.push(`Since fs(${updatedFs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
        } else if (updatedFs >= inputs.fy && updatedFs < 1000) {
          phi = 0.65 + 0.25 * ((updatedFs - inputs.fy) / (1000 - inputs.fy));
          solutions.push(`Since ${inputs.fy} ≤ fs(${updatedFs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25((${updatedFs.toFixed(2)}-${inputs.fy})/(1000-${inputs.fy})) = ${phi.toFixed(4)}`);
        } else {
          phi = 0.65;
          solutions.push(`Since fs(${updatedFs.toFixed(2)}) < fy(${inputs.fy}), Ø = 0.65`);
        }
        
        // Step 5.11: Compute Mu
        Mn = (phi * inputs.As * updatedFs * (inputs.d - updatedA/2)) / 1000000; // Convert to kN·m
        solutions.push(`\nStep 5.11: Compute Mu = Ø × As × fs × (d-a/2) / 10^6`);
        solutions.push(`Mu = ${phi.toFixed(4)} × ${inputs.As} × ${updatedFs.toFixed(2)} × (${inputs.d}-${updatedA.toFixed(2)}/2) / 10^6 = ${Mn.toFixed(2)} kN·m`);
      }
    } else {
      // For Doubly Reinforced Beams
      solutions.push(`\nDoubly Reinforced Beam Analysis:`);
      
      // Step 5.1: Assume compression steel yields and solve for As1
      const As2 = inputs.Asprime;
      const As1 = inputs.As - As2;
      solutions.push(`Step 5.1: Assume compression steel yields and solve for As1`);
      solutions.push(`As2 = As' = ${inputs.Asprime} mm²`);
      solutions.push(`As1 = As - As2 = ${inputs.As} - ${inputs.Asprime} = ${As1.toFixed(2)} mm²`);
      
      // Step 5.2: Solve for 'a'
      const a = (As1 * inputs.fy) / (0.85 * inputs.fc * inputs.b);
      solutions.push(`\nStep 5.2: Compute a = (As1 × fy)/(0.85 × fc' × b) = (${As1.toFixed(2)} × ${inputs.fy})/(0.85 × ${inputs.fc} × ${inputs.b}) = ${a.toFixed(2)} mm`);
      
      // Step 5.3: Solve for 'c'
      const c = a / beta;
      solutions.push(`\nStep 5.3: Compute c = a/β = ${a.toFixed(2)}/${beta.toFixed(4)} = ${c.toFixed(2)} mm`);
      
      // Step 5.4: Solve stresses fs' and fs
      const fprime = 600 * ((c - inputs.dprime) / c); // Compression steel stress
      const fs = 600 * ((inputs.d - c) / c); // Tension steel stress
      solutions.push(`\nStep 5.4: Compute stresses fs' and fs`);
      solutions.push(`fs' = 600((c-d')/c) = 600((${c.toFixed(2)}-${inputs.dprime})/${c.toFixed(2)}) = ${fprime.toFixed(2)} MPa`);
      solutions.push(`fs = 600((d-c)/c) = 600((${inputs.d}-${c.toFixed(2)})/${c.toFixed(2)}) = ${fs.toFixed(2)} MPa`);
      
      // Step 5.5: Compare fs with fy
      const tensionSteelYields = fs >= inputs.fy;
      solutions.push(`\nStep 5.5: Compare fs with fy: ${fs.toFixed(2)} ${tensionSteelYields ? '≥' : '<'} ${inputs.fy} → Tension Steel ${tensionSteelYields ? 'Yields' : 'Does Not Yield'}`);
      
      if (tensionSteelYields) {
        // If tension steel yields
        
        // Step 5.6: Compare fs' with fy
        const compressionSteelYields = fprime >= inputs.fy;
        solutions.push(`\nStep 5.6: Compare fs' with fy: ${fprime.toFixed(2)} ${compressionSteelYields ? '≥' : '<'} ${inputs.fy} → Compression Steel ${compressionSteelYields ? 'Yields' : 'Does Not Yield'}`);
        
        if (compressionSteelYields) {
          // If both tension and compression steel yield
          
          // Step 5.7: Determine reduction factor (Ø)
          solutions.push(`\nStep 5.7: Determine Ø (reduction factor):`);
          
          if (fs >= 1000) {
            phi = 0.90;
            solutions.push(`Since fs(${fs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
          } else if (fs >= inputs.fy && fs < 1000) {
            phi = 0.65 + 0.25 * ((fs - inputs.fy) / (1000 - inputs.fy));
            solutions.push(`Since ${inputs.fy} ≤ fs(${fs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25((${fs.toFixed(2)}-${inputs.fy})/(1000-${inputs.fy})) = ${phi.toFixed(4)}`);
          } else {
            phi = 0.65;
            solutions.push(`Since fs(${fs.toFixed(2)}) < fy(${inputs.fy}), Ø = 0.65`);
          }
          
          // Step 5.8: Compute Mu
          Mn = (phi * (As1 * inputs.fy * (inputs.d - a/2) + inputs.Asprime * inputs.fy * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
          solutions.push(`\nStep 5.8: Compute Mu = Ø × (As1 × fy × (d-a/2) + As' × fy × (d-d')) / 10^6`);
          solutions.push(`Mu = ${phi.toFixed(4)} × (${As1.toFixed(2)} × ${inputs.fy} × (${inputs.d}-${a.toFixed(2)}/2) + ${inputs.Asprime} × ${inputs.fy} × (${inputs.d}-${inputs.dprime})) / 10^6 = ${Mn.toFixed(2)} kN·m`);
        } else {
          // If only tension steel yields (compression steel does not yield)
          
          // Step 5.9: Recalculate 'c' using quadratic formula
          solutions.push(`\nStep 5.9: Compression steel does not yield - Determine c using quadratic formula:`);
          
          solutions.push(`c₁ = (-(600A's - Asfy) + √((600A's - Asfy)² + 2040fc'bA's'd')) / (1.7fc'b)`);
          solutions.push(`c₁ = (-(600·${inputs.Asprime} - ${inputs.As}·${inputs.fy}) + √((600·${inputs.Asprime} - ${inputs.As}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.Asprime}·${inputs.dprime})) / (1.7·${inputs.fc}·${inputs.b})`);
          
          const A = 1.7 * inputs.fc * inputs.b;
          const B = -(600 * inputs.Asprime - inputs.As * inputs.fy);
          const C = 2040 * inputs.fc * inputs.b * inputs.Asprime * inputs.dprime;
          
          const discriminant = Math.pow(B, 2) - 4 * A * (-C);
          
          if (discriminant < 0) {
            toast.error("No valid solutions found for this beam configuration");
            return;
          }
          
          const c1 = (-B + Math.sqrt(discriminant)) / (2 * A);
          const c2 = (-B - Math.sqrt(discriminant)) / (2 * A);
          
          solutions.push(`c₁ = ${c1.toFixed(2)} mm`);
          
          solutions.push(`c₂ = (-(600A's - Asfy) - √((600A's - Asfy)² + 2040fc'bA's'd')) / (1.7fc'b)`);
          solutions.push(`c₂ = (-(600·${inputs.Asprime} - ${inputs.As}·${inputs.fy}) - √((600·${inputs.Asprime} - ${inputs.As}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.Asprime}·${inputs.dprime})) / (1.7·${inputs.fc}·${inputs.b})`);
          solutions.push(`c₂ = ${c2.toFixed(2)} mm`);
          
          // Select the highest value of c that doesn't exceed beam height
          let selectedC = Math.max(c1, c2);
          if (selectedC > inputs.d) {
            selectedC = Math.min(inputs.d, Math.max(c1, c2));
          }
          
          solutions.push(`Select the highest value of c that doesn't exceed beam height (${inputs.d} mm)`);
          solutions.push(`Selected c = ${selectedC.toFixed(2)} mm`);
          
          // Step 5.10: Calculate 'a' and recalculate fs' and fs
          const updatedA = beta * selectedC;
          const updatedFprime = 600 * ((selectedC - inputs.dprime) / selectedC);
          const updatedFs = 600 * ((inputs.d - selectedC) / selectedC);
          
          solutions.push(`\nStep 5.10: Compute a = β × c = ${beta.toFixed(4)} × ${selectedC.toFixed(2)} = ${updatedA.toFixed(2)} mm`);
          solutions.push(`Compute fs' = 600((c-d')/c) = 600((${selectedC.toFixed(2)}-${inputs.dprime})/${selectedC.toFixed(2)}) = ${updatedFprime.toFixed(2)} MPa`);
          solutions.push(`Compute fs = 600((d-c)/c) = 600((${inputs.d}-${selectedC.toFixed(2)})/${selectedC.toFixed(2)}) = ${updatedFs.toFixed(2)} MPa`);
          
          // Step 5.11: Determine reduction factor (Ø)
          solutions.push(`\nStep 5.11: Determine Ø (reduction factor):`);
          
          if (updatedFs >= 1000) {
            phi = 0.90;
            solutions.push(`Since fs(${updatedFs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
          } else if (updatedFs >= inputs.fy && updatedFs < 1000) {
            phi = 0.65 + 0.25 * ((updatedFs - inputs.fy) / (1000 - inputs.fy));
            solutions.push(`Since ${inputs.fy} ≤ fs(${updatedFs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25((${updatedFs.toFixed(2)}-${inputs.fy})/(1000-${inputs.fy})) = ${phi.toFixed(4)}`);
          } else {
            phi = 0.65;
            solutions.push(`Since fs(${updatedFs.toFixed(2)}) < fy(${inputs.fy}), Ø = 0.65`);
          }
          
          // Step 5.12: Compute Mu
          Mn = (phi * (0.85 * inputs.fc * updatedA * inputs.b * (inputs.d - updatedA/2) + inputs.Asprime * updatedFprime * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
          solutions.push(`\nStep 5.12: Compute Mu = Ø × (0.85 × fc' × a × b × (d-a/2) + As' × fs' × (d-d')) / 10^6`);
          solutions.push(`Mu = ${phi.toFixed(4)} × (0.85 × ${inputs.fc} × ${updatedA.toFixed(2)} × ${inputs.b} × (${inputs.d}-${updatedA.toFixed(2)}/2) + ${inputs.Asprime} × ${updatedFprime.toFixed(2)} × (${inputs.d}-${inputs.dprime})) / 10^6 = ${Mn.toFixed(2)} kN·m`);
        }
      } else {
        // If tension steel does not yield
        
        // Step 5.13: Recalculate 'c' using quadratic formula
        solutions.push(`\nStep 5.13: Tension steel does not yield - Determine c using quadratic formula:`);
        
        solutions.push(`c₁ = (-(600As + A'sfy) + √((600As + A'sfy)² + 2040fc'bAsd)) / (1.7fc'b)`);
        solutions.push(`c₁ = (-(600·${inputs.As} + ${inputs.Asprime}·${inputs.fy}) + √((600·${inputs.As} + ${inputs.Asprime}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        
        const A = 1.7 * inputs.fc * inputs.b;
        const B = -(600 * inputs.As + inputs.Asprime * inputs.fy);
        const C = 2040 * inputs.fc * inputs.b * inputs.As * inputs.d;
        
        const discriminant = Math.pow(B, 2) - 4 * A * (-C);
        
        if (discriminant < 0) {
          toast.error("No valid solutions found for this beam configuration");
          return;
        }
        
        const c1 = (-B + Math.sqrt(discriminant)) / (2 * A);
        const c2 = (-B - Math.sqrt(discriminant)) / (2 * A);
        
        solutions.push(`c₁ = ${c1.toFixed(2)} mm`);
        
        solutions.push(`c₂ = (-(600As + A'sfy) - √((600As + A'sfy)² + 2040fc'bAsd)) / (1.7fc'b)`);
        solutions.push(`c₂ = (-(600·${inputs.As} + ${inputs.Asprime}·${inputs.fy}) - √((600·${inputs.As} + ${inputs.Asprime}·${inputs.fy})² + 2040·${inputs.fc}·${inputs.b}·${inputs.As}·${inputs.d})) / (1.7·${inputs.fc}·${inputs.b})`);
        solutions.push(`c₂ = ${c2.toFixed(2)} mm`);
        
        // Select the highest value of c that doesn't exceed beam height
        let selectedC = Math.max(c1, c2);
        if (selectedC > inputs.d) {
          selectedC = Math.min(inputs.d, Math.max(c1, c2));
        }
        
        solutions.push(`Select the highest value of c that doesn't exceed beam height (${inputs.d} mm)`);
        solutions.push(`Selected c = ${selectedC.toFixed(2)} mm`);
        
        // Calculate fs' and fs with the selected 'c'
        const updatedA = beta * selectedC;
        const updatedFprime = 600 * ((selectedC - inputs.dprime) / selectedC);
        const updatedFs = 600 * ((inputs.d - selectedC) / selectedC);
        
        solutions.push(`Compute a = β × c = ${beta.toFixed(4)} × ${selectedC.toFixed(2)} = ${updatedA.toFixed(2)} mm`);
        solutions.push(`Compute fs' = 600((c-d')/c) = 600((${selectedC.toFixed(2)}-${inputs.dprime})/${selectedC.toFixed(2)}) = ${updatedFprime.toFixed(2)} MPa`);
        solutions.push(`Compute fs = 600((d-c)/c) = 600((${inputs.d}-${selectedC.toFixed(2)})/${selectedC.toFixed(2)}) = ${updatedFs.toFixed(2)} MPa`);
        
        // Determine reduction factor (Ø)
        if (updatedFs >= 1000) {
          phi = 0.90;
          solutions.push(`Since fs(${updatedFs.toFixed(2)}) ≥ 1000, Ø = 0.90`);
        } else if (updatedFs >= inputs.fy && updatedFs < 1000) {
          phi = 0.65 + 0.25 * ((updatedFs - inputs.fy) / (1000 - inputs.fy));
          solutions.push(`Since ${inputs.fy} ≤ fs(${updatedFs.toFixed(2)}) < 1000, Ø = 0.65 + 0.25((${updatedFs.toFixed(2)}-${inputs.fy})/(1000-${inputs.fy})) = ${phi.toFixed(4)}`);
        } else {
          phi = 0.65;
          solutions.push(`Since fs(${updatedFs.toFixed(2)}) < fy(${inputs.fy}), Ø = 0.65`);
        }
        
        // Calculate moment Mu
        if (updatedFprime >= inputs.fy) {
          // If compression steel yields
          Mn = (phi * (0.85 * inputs.fc * updatedA * inputs.b * (inputs.d - updatedA/2) + inputs.Asprime * inputs.fy * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
          solutions.push(`Compute Mu = Ø × (0.85 × fc' × a × b × (d-a/2) + As' × fy × (d-d')) / 10^6`);
          solutions.push(`Mu = ${phi.toFixed(4)} × (0.85 × ${inputs.fc} × ${updatedA.toFixed(2)} × ${inputs.b} × (${inputs.d}-${updatedA.toFixed(2)}/2) + ${inputs.Asprime} × ${inputs.fy} × (${inputs.d}-${inputs.dprime})) / 10^6 = ${Mn.toFixed(2)} kN·m`);
        } else {
          // If compression steel does not yield
          Mn = (phi * (0.85 * inputs.fc * updatedA * inputs.b * (inputs.d - updatedA/2) + inputs.Asprime * updatedFprime * (inputs.d - inputs.dprime))) / 1000000; // Convert to kN·m
          solutions.push(`Compute Mu = Ø × (0.85 × fc' × a × b × (d-a/2) + As' × fs' × (d-d')) / 10^6`);
          solutions.push(`Mu = ${phi.toFixed(4)} × (0.85 × ${inputs.fc} × ${updatedA.toFixed(2)} × ${inputs.b} × (${inputs.d}-${updatedA.toFixed(2)}/2) + ${inputs.Asprime} × ${updatedFprime.toFixed(2)} × (${inputs.d}-${inputs.dprime})) / 10^6 = ${Mn.toFixed(2)} kN·m`);
        }
      }
    }
    
    const finalAnswer = `The beam is ${beamType} with a moment capacity of ${Mn.toFixed(2)} kN·m.`;
    
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
