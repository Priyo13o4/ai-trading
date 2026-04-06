"use client"

import { useEffect, useState } from "react"
import { useLowSpecDevice } from "@/hooks/useLowSpecDevice"

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

export default function DemoOne() {
  const shaderSpeed = 0.18
  const isLowSpecDevice = useLowSpecDevice()
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  )
  const [MeshGradientComponent, setMeshGradientComponent] = useState<MeshGradientComponent | null>(null)
  const [shaderImportFailed, setShaderImportFailed] = useState(false)

  const shouldRunShader = isDocumentVisible && !isLowSpecDevice && !shaderImportFailed

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
    }).catch(() => {
      if (!cancelled) {
        setShaderImportFailed(true)
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
        <MeshGradientComponent
          className="absolute inset-0 pointer-events-none"
          colors={["#0B0D0F", "#1F1A16", "#3D2B1F", "#8B6B4A", "#E2B485"]}
          speed={shaderSpeed}
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