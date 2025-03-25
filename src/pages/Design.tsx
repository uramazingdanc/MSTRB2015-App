
import { DesignForm } from "@/components/DesignForm";

const Design = () => {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] py-12 px-4">
      <div className="max-w-4xl mx-auto mb-10 text-center animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-medium mb-3">Beam Design</h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Create reinforced beam specifications based on your required moment capacity according to NSCP 2015 standards.
        </p>
      </div>
      
      <DesignForm />
    </div>
  );
};

export default Design;
