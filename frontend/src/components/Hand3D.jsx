import React from "react";
import { Canvas } from "@react-three/fiber";
import { Sphere, Box } from "@react-three/drei";
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

  return (
    <Canvas
      style={{
        width: "400px",
        height: "400px",
      }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />

      {/* Render each hand */}
      {handData.map((hand, handIndex) => (
        <React.Fragment key={`hand-${handIndex}`}>
          {/* Render joints */}
          {hand.map((landmark, idx) => (
            <Sphere
              key={`joint-${handIndex}-${idx}`}
              args={[0.1, 32, 32]} // Larger joints
              position={[
                landmark.x * 4 - 2, // Center adjustments
                -landmark.y * 4 + 2, // Flip Y-axis
                -landmark.z * 4,
              ]}
              material={new THREE.MeshStandardMaterial({ color: "blue" })} // Blue joints
            />
          ))}

          {/* Render finger segments */}
          {fingerSegments.map(([start, end], segmentIdx) => {
            const startPos = hand[start];
            const endPos = hand[end];
            if (!startPos || !endPos) return null;

            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;
            const midZ = (startPos.z + endPos.z) / 2;

            const length = Math.sqrt(
              Math.pow(endPos.x - startPos.x, 2) +
                Math.pow(endPos.y - startPos.y, 2) +
                Math.pow(endPos.z - startPos.z, 2)
            );

            return (
              <Box
                key={`segment-${handIndex}-${segmentIdx}`}
                args={[0.05, length * 4, 0.05]} // Thicker finger segments
                position={[
                  midX * 4 - 2, // Center adjustments
                  -midY * 4 + 2, // Flip Y-axis
                  -midZ * 4,
                ]}
                rotation={[
                  Math.atan2(endPos.y - startPos.y, endPos.z - startPos.z),
                  Math.atan2(endPos.x - startPos.x, endPos.z - startPos.z),
                  0,
                ]}
                material={new THREE.MeshStandardMaterial({ color: "blue" })} // Blue segments
              />
            );
          })}
        </React.Fragment>
      ))}
    </Canvas>
  );
};

export default Hand3D;
