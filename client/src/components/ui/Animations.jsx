import { motion, useTransform, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";

// 1. COUNT UP (For Scores: 0 -> 85)
export const CountUp = ({ to, duration = 2 }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, to, { duration });
    return controls.stop;
  }, [to, count, duration]);

  return <motion.span>{rounded}</motion.span>;
};

// 2. TYPEWRITER (For AI Text)
export const Typewriter = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText(""); // Reset
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}<span className="animate-pulse">|</span></span>;
};

// 3. PROGRESS BAR (For ATS Matches)
export const AnimatedProgress = ({ value, color = "bg-indigo-500" }) => {
  return (
    <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`h-full ${color}`}
      />
    </div>
  );
};
