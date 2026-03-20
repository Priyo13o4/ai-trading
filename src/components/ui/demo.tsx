"use client"

import { useEffect, useState } from "react"

type MeshGradientComponent = (props: {
  className?: string
  colors?: string[]
  speed?: number
  frame?: number
}) => JSX.Element

const LUMINA_BACKGROUND_STYLE = {
  background:
    "radial-gradient(100% 50% at 50% -15%, rgba(226, 180, 133, 0.14) 0%, rgba(226, 180, 133, 0) 70%), radial-gradient(50% 50% at 85% 85%, rgba(200, 147, 90, 0.08) 0%, rgba(200, 147, 90, 0) 60%), linear-gradient(180deg, #111315 0%, #0d0e10 40%, #040506 100%)",
} as const

// Isolated component for 30 FPS manual frame driving
const ThrottledMeshGradient = ({
  ShaderComponent,
  speed
}: {
  ShaderComponent: MeshGradientComponent;
  speed: number
}) => {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    let lastTime = performance.now()
    let animationFrameId: number

    const loop = (currentTime: number) => {
      // 30 FPS cap = ~33.3ms per frame
      if (currentTime - lastTime >= 33.3) {
        setFrame(currentTime)
        lastTime = currentTime
      }
      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    // Half-resolution rendering wrapper: Shrink physical size by 2, CSS scale back up.
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: "50%", height: "50%", transform: "scale(2)", transformOrigin: "top left" }}
    >
      <ShaderComponent
        className="w-full h-full"
        colors={["#0B0D0F", "#1F1A16", "#3D2B1F", "#8B6B4A", "#E2B485"]}
        speed={0} // Freeze internal uncontrolled requestAnimationFrame
        frame={frame * speed} // Manually drive the shader uniforms at 30fps
      />
    </div>
  )
}

export default function DemoOne() {
  const speed = 0.5
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  )
  const [MeshGradientComponent, setMeshGradientComponent] = useState<MeshGradientComponent | null>(null)

  const shouldRunShader = isDocumentVisible

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!shouldRunShader || MeshGradientComponent) {
      return
    }

    let cancelled = false

    void import("@paper-design/shaders-react").then((module) => {
      if (!cancelled) {
        setMeshGradientComponent(() => module.MeshGradient as MeshGradientComponent)
      }
    })

    return () => {
      cancelled = true
    }
  }, [shouldRunShader, MeshGradientComponent])

  return (
    <div className="w-full h-screen bg-[#040506] relative overflow-hidden">
      {!shouldRunShader || !MeshGradientComponent ? (
        <div
          className="w-full h-full absolute inset-0"
          style={LUMINA_BACKGROUND_STYLE}
        />
      ) : (
        <ThrottledMeshGradient
          ShaderComponent={MeshGradientComponent}
          speed={speed}
        />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="absolute top-8 left-8 pointer-events-auto"></div>

        {/* Effect Controls */}
        <div className="absolute bottom-8 left-8 pointer-events-auto"></div>

        {/* Parameter Controls */}
        <div className="absolute bottom-8 right-8 pointer-events-auto space-y-4"></div>

        {/* Status indicator */}
        <div className="absolute top-8 right-8 pointer-events-auto"></div>
      </div>
    </div>
  )
}