import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { useState, useRef, useEffect } from 'react';

const NeuralNetwork = (props) => {
  const ref = useRef();
  const { camera: _camera } = useThree(); // Keep for type checking if needed
  // Generate 5000 points in a sphere
  const [sphere] = useState(() => {
    try {
      // Need length divisible by stride (3) to avoid computeBoundingSphere NaN
      const positions = random.inSphere(new Float32Array(5000 * 3), { radius: 1.5 });
      // Validate positions to prevent NaN
      for (let i = 0; i < positions.length; i++) {
        if (!isFinite(positions[i])) positions[i] = 0;
      }
      return positions;
    } catch (e) {
      console.warn('Failed to generate sphere positions:', e);
      return new Float32Array(5000 * 3);
    }
  });

  useFrame((state, delta) => {
    if (!ref.current) return;
    // Rotates the entire cloud slowly
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
    
    // Follow mouse movement smoothly with validation
    const targetX = (props.mouse?.x || 0) * 0.5;
    const targetY = (props.mouse?.y || 0) * 0.5;
    
    if (isFinite(targetX) && isFinite(targetY)) {
      state.camera.position.x += (targetX - state.camera.position.x) * 0.02;
      state.camera.position.y += (targetY - state.camera.position.y) * 0.02;
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.005} // Very subtle dots
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

export default function HeroScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 h-screen w-full bg-transparent">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <NeuralNetwork mouse={mouse} />
      </Canvas>
    </div>
  );
}
