import { PropsWithChildren, useEffect, useRef, useState } from "react";

interface RevealProps extends PropsWithChildren<{
  delay?: number;
  className?: string;
  onVisible?: () => void; // Add this new callback prop
}> { }

const Reveal = ({ children, delay = 0, className = "", onVisible }: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const hasNotifiedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      if (!hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        onVisible?.();
      }
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (!hasNotifiedRef.current) {
              hasNotifiedRef.current = true;
              onVisible?.();
            }
            obs.disconnect();
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export { Reveal };
export default Reveal;

