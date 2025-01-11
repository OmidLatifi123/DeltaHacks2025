import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";

const ElectricPianoModel = () => {
  const { scene } = useGLTF("/3D-Models/ElectricPiano.glb");

  return (
    <>
      <primitive object={scene} scale={0.5} />
      <Html position={[0, 1, 0]}>
        <div
          style={{
            color: "white",
            background: "rgba(0,0,0,0.7)",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          Piano Model
        </div>
      </Html>
    </>
  );
};

export default ElectricPianoModel;

