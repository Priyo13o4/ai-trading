import { useMemo } from "react";

const dots = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 3}s`,
}));

const Particles = () => {
  const items = useMemo(() => dots, []);
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {items.map((d) => (
        <span
          key={d.id}
          className="absolute block h-1.5 w-1.5 rounded-full bg-brand/40 animate-float-y"
          style={{ left: d.left, top: d.top, animationDelay: d.delay }}
        />
      ))}
    </div>
  );
};

export default Particles;
