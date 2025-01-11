import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

const ElectricPianoModel = () => {
  const { scene } = useGLTF("/3D-Models/ElectricPiano.glb", true);

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, -1, 0]}
      rotation={[Math.PI / 6, -Math.PI / 2, 0]} // Adjust rotation here
    />
  );
};

const ElectricPianoCanvas = () => {
  return (
    <Canvas
      style={{ height: "600px", width: "100%" }}
      camera={{ position: [0, 2, 10], fov: 50 }}
    >
      <Suspense fallback={<div>Loading...</div>}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} />

        {/* 3D Model */}
        <ElectricPianoModel />

        {/* Orbit Controls */}
        <OrbitControls enableZoom={true} />
      </Suspense>
    </Canvas>
  );
};

export default ElectricPianoCanvas;
