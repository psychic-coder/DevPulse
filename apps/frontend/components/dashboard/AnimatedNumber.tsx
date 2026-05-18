import { useEffect, useState } from "react";

export function AnimatedNumber({ value, suffix = "", duration = 0.8 }: { value: number; suffix?: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = displayValue;
    const animate = (time: number) => {
      const progress = Math.min((time - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (value - from) * eased);
      setDisplayValue(next);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [duration, value]);

  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}
