
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const PageTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState("page-enter");
  
  useEffect(() => {
    if (location.pathname !== "/") {
      setTransitionStage("page-exit-active");
      
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage("page-enter");
        
        const enterTimeout = setTimeout(() => {
          setTransitionStage("page-enter-active");
        }, 50);
        
        return () => clearTimeout(enterTimeout);
      }, 300);
      
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
      setTransitionStage("page-enter");
      
      const timeout = setTimeout(() => {
        setTransitionStage("page-enter-active");
      }, 50);
      
      return () => clearTimeout(timeout);
    }
  }, [children, location]);
  
  return (
    <div className={`w-full ${transitionStage}`}>
      {displayChildren}
    </div>
  );
};
