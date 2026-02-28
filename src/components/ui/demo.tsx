"use client"

import { useEffect, useState } from "react"
import { useLowSpecDevice } from "@/hooks/useLowSpecDevice"

type MeshGradientComponent = (props: {
  className?: string
  colors?: string[]
  speed?: number
}) => JSX.Element

const NAVY_BACKGROUND_STYLE = {
  background:
    "radial-gradient(70% 55% at 25% 20%, rgba(26, 46, 75, 0.24) 0%, rgba(26, 46, 75, 0) 65%), radial-gradient(55% 45% at 78% 72%, rgba(20, 34, 56, 0.2) 0%, rgba(20, 34, 56, 0) 70%), linear-gradient(160deg, #060a13 0%, #0c1423 52%, #111d31 100%)",
} as const

export default function DemoOne() {
  const speed = 0.5
  const isLowSpecDevice = useLowSpecDevice()
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  )
  const [MeshGradientComponent, setMeshGradientComponent] = useState<MeshGradientComponent | null>(null)

  const shouldRunShader = !isLowSpecDevice && isDocumentVisible

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
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {!shouldRunShader || !MeshGradientComponent ? (
        <div
          className="w-full h-full absolute inset-0"
          style={NAVY_BACKGROUND_STYLE}
        />
      ) : (
        <MeshGradientComponent
          className="w-full h-full absolute inset-0"
          colors={["#0a0d1a", "#1a1d29", "#2d3748", "#3d4a5e", "#4a5568"]}
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

      {/* Lighting overlay effects */}
      {shouldRunShader && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/3 w-32 h-32 bg-gray-800/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: `${3 / speed}s` }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/2 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: `${2 / speed}s`, animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 right-1/3 w-20 h-20 bg-gray-900/3 rounded-full blur-xl animate-pulse"
            style={{ animationDuration: `${4 / speed}s`, animationDelay: "0.5s" }}
          />
        </div>
      )}
    </div>
  )
}
