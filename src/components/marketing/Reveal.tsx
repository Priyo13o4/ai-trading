import { PropsWithChildren, useEffect, useRef, useState } from "react";

interface RevealProps extends PropsWithChildren<{
  delay?: number;
  className?: string;
  onVisible?: () => void; // Add this new callback prop
}> {}

const Reveal = ({ children, delay = 0, className = "", onVisible }: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            onVisible?.(); // Call the callback when the element is visible
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]); // Important: Add the callback to the dependency array

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default Reveal;