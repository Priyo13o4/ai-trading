import { MeshGradient } from '@paper-design/shaders-react';
import { cn } from '@/lib/utils';

interface MeshGradientLayerProps {
  className?: string;
  speed?: number;
  colors?: string[];
}

const DEFAULT_MESH_COLORS = ['#0a0d1a', '#1a1d29', '#2d3748', '#3d4a5e', '#4a5568'];

export function MeshGradientLayer({ className, speed = 0.22, colors = DEFAULT_MESH_COLORS }: MeshGradientLayerProps) {
  return (
    <MeshGradient
      className={cn('absolute inset-0 h-full w-full', className)}
      colors={colors}
      speed={speed}
    />
  );
}
