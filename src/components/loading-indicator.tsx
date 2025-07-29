
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import motion components with SSR turned off
const motion = {
  div: dynamic(() => import("framer-motion").then((mod) => mod.motion.div), { ssr: false }),
  circle: dynamic(() => import("framer-motion").then((mod) => mod.motion.circle), { ssr: false }),
  path: dynamic(() => import("framer-motion").then((mod) => mod.motion.path), { ssr: false }),
  text: dynamic(() => import("framer-motion").then((mod) => mod.motion.text), { ssr: false }),
  span: dynamic(() => import("framer-motion").then((mod) => mod.motion.span), { ssr: false }),
};


const LoadingIndicator = ({
  blurAmount = 5,
  borderColor = "hsl(var(--primary))",
  animationDuration = 2,
  pauseBetweenAnimations = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0, opacity: 0 });

  useEffect(() => {
    if (logoRef.current && containerRef.current) {
        const parentRect = containerRef.current.getBoundingClientRect();
        const activeRect = logoRef.current.getBoundingClientRect();
        
        setFocusRect({
            x: activeRect.left - parentRect.left,
            y: activeRect.top - parentRect.top,
            width: activeRect.width,
            height: activeRect.height,
            opacity: 1
        });
    }
  }, []);

  return (
    <div
      className="relative flex flex-col gap-4 justify-center items-center"
      ref={containerRef}
    >
      <div ref={logoRef} className="flex items-center justify-center">
         <svg width="200" height="90" viewBox="0 0 170 80" className="text-primary">
            <motion.circle 
                cx="40" 
                cy="40" 
                r="35" 
                fill="hsl(var(--primary))"
                initial={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <text x="40" y="20" fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" fontSize="100" fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central">m</text>
            <motion.path 
                d="M 80 45 C 80 55, 90 55, 90 45 C 90 35, 85 25, 80 45 Z" 
                fill="hsl(var(--primary))"
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
            />
            <motion.text 
                x="95" 
                y="50" 
                fontFamily="cursive, 'Brush Script MT', 'Apple Chancery'" 
                fontSize="30" 
                fill="hsl(var(--primary))" 
                dy=".3em"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
            >
                waters
            </motion.text>
            <motion.text 
                x="115" 
                y="68" 
                fontFamily="sans-serif" 
                fontSize="10" 
                fill="hsl(var(--muted-foreground))" 
                dy=".3em"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
            >
                FIT TO LIVE
            </motion.text>
        </svg>
      </div>

      <motion.div
        className="absolute top-0 left-0 pointer-events-none box-border border-0"
        initial={{
            opacity: 0,
        }}
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: focusRect.opacity,
        }}
        transition={{
          duration: 0.8,
          ease: "circOut"
        }}
        style={{
          "--border-color": borderColor,
        }}
      >
        <motion.span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] left-[-10px] border-r-0 border-b-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
          initial={{ opacity: 0, x: -5, y: -5 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}

        ></motion.span>
        <motion.span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] right-[-10px] border-l-0 border-b-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
           initial={{ opacity: 0, x: 5, y: -5 }}
           animate={{ opacity: 1, x: 0, y: 0 }}
           transition={{ duration: 0.5, delay: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        ></motion.span>
        <motion.span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] left-[-10px] border-r-0 border-t-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
           initial={{ opacity: 0, x: -5, y: 5 }}
           animate={{ opacity: 1, x: 0, y: 0 }}
           transition={{ duration: 0.5, delay: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        ></motion.span>
        <motion.span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] right-[-10px] border-l-0 border-t-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
           initial={{ opacity: 0, x: 5, y: 5 }}
           animate={{ opacity: 1, x: 0, y: 0 }}
           transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        ></motion.span>
      </motion.div>
      <p className="text-muted-foreground animate-pulse">Loading Application...</p>
    </div>
  );
};

export default LoadingIndicator;
