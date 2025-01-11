import React from "react";
import { Canvas } from "@react-three/fiber";
import { Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

const Hand3D = ({ handData }) => {
  if (!handData || handData.length === 0) {
    return <div style={{ color: "red" }}>No hand data available.</div>;
  }

  const fingerSegments = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [5, 6], [6, 7], [7, 8],         // Index
    [9, 10], [10, 11], [11, 12],    // Middle
    [13, 14], [14, 15], [15, 16],   // Ring
    [17, 18], [18, 19], [19, 20],   // Pinky
  ];

  const palmConnections = [
    [0, 5], [0, 9], [0, 13], [0, 17], [5, 9], [9, 13], [13, 17], [5, 17],
    [0, 1], [5, 6], [9, 10], [13, 14], [17, 18], // Thumb base and finger bases
  ];

  const generateCylinder = (start, end, color) => {
    const startVector = new THREE.Vector3(start.x * 8 - 4, -start.y * 8 + 4, -start.z * 8 - 2);
    const endVector = new THREE.Vector3(end.x * 8 - 4, -end.y * 8 + 4, -end.z * 8 - 2);
    const midPoint = startVector.clone().add(endVector).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(endVector, startVector);
    const length = direction.length();
    const orientation = new THREE.Matrix4().lookAt(startVector, endVector, new THREE.Vector3(0, 1, 0));
    orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

    return (
      <Cylinder
        args={[0.15, 0.15, length, 16]}
        position={[midPoint.x, midPoint.y, midPoint.z]}
        rotation={new THREE.Euler().setFromRotationMatrix(orientation)}
        material={new THREE.MeshStandardMaterial({ color })}
      />
    );
  };

  return (
    <Canvas
      style={{
        width: "100%", // Full width canvas
        height: "1000px", // Larger height for better view
      }}
      camera={{ position: [0, 0, 15], fov: 60 }} // Camera moved back for broader view
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />

      {/* Rotate the entire hand model */}
      <group rotation={[0, Math.PI, 0]}> {/* Rotates 180° around Y-axis */}
        {/* Render each hand */}
        {handData.map((hand, handIndex) => (
          <React.Fragment key={`hand-${handIndex}`}>
            {/* Palm Connections */}
            {palmConnections.map(([start, end], idx) => (
              <React.Fragment key={`palm-${handIndex}-${idx}`}>
                {generateCylinder(hand[start], hand[end], "blue")}
              </React.Fragment>
            ))}

            {/* Finger Segments */}
            {fingerSegments.map(([start, end], idx) => (
              <React.Fragment key={`finger-${handIndex}-${idx}`}>
                {generateCylinder(hand[start], hand[end], "white")}
              </React.Fragment>
            ))}

            {/* Render Joints */}
            {hand.map((landmark, idx) => (
              <Sphere
                key={`joint-${handIndex}-${idx}`}
                args={[0.12, 32, 32]} // Slightly smaller joints
                position={[
                  landmark.x * 8 - 4,
                  -landmark.y * 8 + 4,
                  -landmark.z * 8 - 2,
                ]}
                material={new THREE.MeshStandardMaterial({ color: "red" })}
              />
            ))}
          </React.Fragment>
        ))}
      </group>
    </Canvas>
  );
};

export default Hand3D;