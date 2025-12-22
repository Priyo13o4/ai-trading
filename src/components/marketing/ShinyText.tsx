import React from "react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 5,
  className = "",
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        color: "rgba(255, 255, 255, 0.78)",
        lineHeight: "1.1",
      }}
    >
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: "inherit",
        }}
      >
        {text}
      </span>

      {!disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-shine"
          style={{
            zIndex: 2,
            backgroundImage:
              "linear-gradient(112deg, rgba(255, 215, 0, 0) 42%, rgba(216, 184, 0, 1) 55%, rgba(255, 215, 0, 0) 58%)",
            backgroundSize: "210% 100%",
            backgroundRepeat: "no-repeat",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            animationDuration,
            animationTimingFunction: "linear",
            filter: "drop-shadow(0 0 14px rgba(255, 215, 0, 0.45))",
            opacity: 0.95,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};
