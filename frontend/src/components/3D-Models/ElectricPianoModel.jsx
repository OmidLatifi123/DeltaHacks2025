import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';

function ElectricPianoModel() {
  const gltf = useGLTF('/3D-Models/ElectricPiano.glb'); // Ensure the path is correct
  const modelRef = useRef();

  // Clone the scene for independent instances
  const clonedScene = clone(gltf.scene);

  // Add rotation animation
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01; // Smooth rotation on the Y-axis
    }
  });

  return (
    <>
      {/* Add lighting */}
      <ambientLight intensity={0.4} /> {/* Soft global lighting */}
      <directionalLight
        position={[5, 5, 5]} // Light source position
        intensity={1.5} // Brightness
        castShadow
      />
      <pointLight position={[-5, 5, 5]} intensity={0.7} /> {/* Dynamic lighting */}

      {/* Piano model */}
      <primitive
        ref={modelRef}
        object={clonedScene}
        scale={0.6} // Adjust scale
        position={[0, -0.5, 0]} // Adjust position for better visibility
      />
    </>
  );
}

export default ElectricPianoModel;
