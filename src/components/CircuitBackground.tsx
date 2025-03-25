
export const CircuitBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Horizontal lines */}
      <div className="circuit-line h-[1px] w-[30%] left-[10%] top-[20%]"></div>
      <div className="circuit-line h-[1px] w-[40%] left-[50%] top-[30%]"></div>
      <div className="circuit-line h-[1px] w-[20%] left-[30%] top-[70%]"></div>
      <div className="circuit-line h-[1px] w-[35%] left-[60%] top-[85%]"></div>
      
      {/* Vertical lines */}
      <div className="circuit-line w-[1px] h-[25%] left-[25%] top-[10%]"></div>
      <div className="circuit-line w-[1px] h-[40%] left-[75%] top-[30%]"></div>
      <div className="circuit-line w-[1px] h-[30%] left-[40%] top-[50%]"></div>
      <div className="circuit-line w-[1px] h-[20%] left-[60%] top-[65%]"></div>
      
      {/* Nodes */}
      <div className="circuit-node w-[4px] h-[4px] left-[10%] top-[20%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[25%] top-[20%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[40%] top-[30%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[50%] top-[30%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[75%] top-[30%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[75%] top-[70%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[40%] top-[50%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[40%] top-[80%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[60%] top-[65%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[60%] top-[85%]"></div>
      <div className="circuit-node w-[4px] h-[4px] left-[95%] top-[85%]"></div>
    </div>
  );
};
