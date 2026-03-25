import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

const FloatingShape = ({
  position,
  color,
  speed,
  scale,
  distort,
  type,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  scale: number;
  distort: number;
  type: "sphere" | "torus" | "icosa" | "octahedron";
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
  });

  const geometry = useMemo(() => {
    switch (type) {
      case "torus":
        return <torusGeometry args={[1, 0.4, 16, 32]} />;
      case "icosa":
        return <icosahedronGeometry args={[1, 1]} />;
      case "octahedron":
        return <octahedronGeometry args={[1, 0]} />;
      default:
        return <sphereGeometry args={[1, 32, 32]} />;
    }
  }, [type]);

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometry}
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={distort}
          speed={speed * 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
};

const WobbleRing = ({
  position,
  color,
  scale,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.15;
  });

  return (
    <Float speed={1.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusGeometry args={[1.5, 0.05, 16, 64]} />
        <MeshWobbleMaterial
          color={color}
          transparent
          opacity={0.25}
          factor={0.3}
          speed={1}
        />
      </mesh>
    </Float>
  );
};

const Particles = ({ count = 80 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * viewport.width * 3;
      pos[i * 3 + 1] = (Math.random() - 0.5) * viewport.height * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sizes[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sizes];
  }, [count, viewport]);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#6366f1"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

const MouseLight = () => {
  const light = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  useFrame(({ pointer }) => {
    if (!light.current) return;
    light.current.position.x = (pointer.x * viewport.width) / 2;
    light.current.position.y = (pointer.y * viewport.height) / 2;
  });

  return <pointLight ref={light} intensity={2} distance={8} color="#818cf8" />;
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} color="#c084fc" />
      <MouseLight />

      <FloatingShape position={[3, 1.5, -2]} color="#6366f1" speed={1.2} scale={1.8} distort={0.4} type="sphere" />
      <FloatingShape position={[-3, -1, -3]} color="#a855f7" speed={0.8} scale={1.4} distort={0.3} type="icosa" />
      <FloatingShape position={[1.5, -2, -1]} color="#38bdf8" speed={1} scale={1} distort={0.5} type="octahedron" />
      <FloatingShape position={[-2, 2, -4]} color="#6366f1" speed={0.6} scale={2} distort={0.2} type="torus" />
      <FloatingShape position={[4, -1.5, -5]} color="#c084fc" speed={0.7} scale={1.2} distort={0.35} type="sphere" />

      <WobbleRing position={[0, 0, -3]} color="#6366f1" scale={2} />
      <WobbleRing position={[3, 2, -5]} color="#a855f7" scale={1.2} />

      <Particles count={100} />
    </>
  );
};

const HeroScene3D = () => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default HeroScene3D;
