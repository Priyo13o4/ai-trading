import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function useMarketCurve() {
  return useMemo(() => {
    const points: THREE.Vector3[] = [];
    const len = 120;
    for (let i = 0; i < len; i++) {
      const t = i / (len - 1);
      const x = THREE.MathUtils.lerp(-6, 6, t);
      const y = Math.sin(t * Math.PI * 2) * 0.7 + Math.sin(t * Math.PI * 5) * 0.18 + (Math.random() - 0.5) * 0.1;
      const z = Math.cos(t * Math.PI * 1.5) * 0.3;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);
}

function MovingParticles({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.children.forEach((child, idx) => {
      const tt = ((t * 0.15 + idx * 0.12) % 1 + 1) % 1;
      const p = curve.getPointAt(tt);
      child.position.set(p.x, p.y, p.z);
    });
  });
  const count = 10;
  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#5af2d9" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function TradingCurve() {
  const curve = useMarketCurve();
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const matGlow = useRef<THREE.MeshBasicMaterial>(null);

  // Subtle breathing emissive
  useFrame(({ clock }) => {
    const s = 0.6 + Math.sin(clock.getElapsedTime() * 1.3) * 0.2;
    if (mat.current) mat.current.emissiveIntensity = 0.6 * s;
    if (matGlow.current) matGlow.current.opacity = 0.18 * s;
  });

  return (
    <group>
      {/* Main tube */}
      <mesh>
        <tubeGeometry args={[curve, 350, 0.07, 32, false]} />
        <meshStandardMaterial
          ref={mat}
          color={new THREE.Color("#1de6c5")}
          emissive={new THREE.Color("#1de6c5")}
          emissiveIntensity={0.6}
          metalness={0.45}
          roughness={0.2}
        />
      </mesh>

      {/* Soft glow */}
      <mesh>
        <tubeGeometry args={[curve, 350, 0.15, 32, false]} />
        <meshBasicMaterial ref={matGlow} color={new THREE.Color("#1de6c5")} transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </mesh>

      <MovingParticles curve={curve} />
    </group>
  );
}

const MarketScene = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-30 select-none">
      <Canvas camera={{ position: [0, 0.6, 6], fov: 50 }} dpr={[1, 1.8]}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} color={new THREE.Color("#a3fff1")} />
        <directionalLight position={[-6, -4, -2]} intensity={0.3} color={new THREE.Color("#00c2ff")} />

        {/* Ground grid */}
        <group position={[0, -1.4, 0]}
               rotation={[-Math.PI / 2.4, 0, 0]}>
          <Grid
            args={[30, 30]}
            cellSize={0.7}
            cellThickness={0.4}
            sectionSize={7}
            sectionThickness={1}
            sectionColor={new THREE.Color("#0ea5e9")} // accent tinted
            cellColor={new THREE.Color("#22d3ee")} // brand tinted
            fadeDistance={18}
            fadeStrength={2}
            infiniteGrid
          />
        </group>

        {/* Trading curve */}
        <group position={[0, 0.2, 0]}>
          <TradingCurve />
        </group>

        {/* Disable user controls but keep scene stable */}
        <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default MarketScene;
