import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const Hand3D = ({ handData }) => {
  // Check if handData is available at the top of the component
  if (!handData || handData.length === 0) {
    return <div style={{ color: "red" }}>No hand data available.</div>;
  }

  // Define finger segments and palm connections
  const fingerSegments = [
    [1, 2], [2, 3], [3, 4], // Thumb
    [5, 6], [6, 7], [7, 8],         // Index
    [9, 10], [10, 11], [11, 12],    // Middle
    [13, 14], [14, 15], [15, 16],   // Ring
    [17, 18], [18, 19], [19, 20],   // Pinky
  ];

  const palmConnections = [
    [24, 1], [23, 5], [23, 9], [22, 13], [21, 17], [23, 17], [21, 5], // Thumb and finger bases
    [5, 9], [9, 13], [13, 17], [5, 17], // Connect bases of fingers
    [21, 5], [21, 9], // New left palm point to thumb and index bases
    [22, 17], [22, 13], [23, 24], // New right palm point to pinky and ring bases
  ];

  // Function to generate new palm points
  const generatePalmPoints = (hand) => {
    const leftPoint1 = {
      x: hand[0].x + (hand[5].x - hand[0].x) * 0.6,
      y: hand[0].y + (hand[5].y - hand[0].y) * 0.1,
      z: hand[0].z + (hand[5].z - hand[0].z) * 0.8,
    };
    const leftPoint2 = {
      x: hand[0].x + (hand[9].x - hand[0].x) * 0.6,
      y: hand[0].y + (hand[9].y - hand[0].y) * 0.05,
      z: hand[0].z + (hand[9].z - hand[0].z) * 0.8,
    };

    const rightPoint1 = {
      x: hand[0].x + (hand[17].x - hand[0].x) * 0.6,
      y: hand[0].y + (hand[17].y - hand[0].y) * 0.1,
      z: hand[0].z + (hand[17].z - hand[0].z) * 0.8,
    };
    const rightPoint2 = {
      x: hand[0].x + (hand[13].x - hand[0].x) * 0.6,
      y: hand[0].y + (hand[13].y - hand[0].y) * 0.05,
      z: hand[0].z + (hand[13].z - hand[0].z) * 0.8,
    };

    hand.push(leftPoint1); // Left point 1
    hand.push(leftPoint2); // Left point 2
    hand.push(rightPoint1); // Right point 1
    hand.push(rightPoint2); // Right point 2

    return hand;
  };

  const generateCylinder = (start, end) => {
    const startVector = new THREE.Vector3(start.x * 8 - 5.4, -start.y * 8 + 4.4, -start.z * 8 - 2);
    const endVector = new THREE.Vector3(end.x * 8 - 5.4, -end.y * 8 + 4.4, -end.z * 8 - 2);
    const midPoint = startVector.clone().add(endVector).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(endVector, startVector);
    const length = direction.length();
    const orientation = new THREE.Matrix4().lookAt(startVector, endVector, new THREE.Vector3(0, 1, 0));
    orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, // Uniform for controlling time
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPosition;
  
        void main() {
          // Set a static color for the cylinders (monochromatic #0a205a)
          vec3 monochromeColor = vec3(0.02, 0.07, 0.2); // RGB for #0a205a
  
          // Static stars: Add stars at fixed locations (adjustable as needed)
          float starFrequency = 100.0; // Adjust this to change how many stars appear
          float flicker = fract(uTime / 10.0); // Scale uTime for slower flicker
          float starPresence = step(0.97, fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233 + flicker))) * 43758.5453 * starFrequency));
  
          // Combine the monochrome color with static white stars
          vec3 speckledColor = mix(monochromeColor, vec3(1.0, 1.0, 1.0), starPresence);
  
          // Final color with transparency to simulate space background
          gl_FragColor = vec4(speckledColor, 1.0);
        }
      `,
      transparent: true,
    });
  
    return (
      <Cylinder
        args={[0.15, 0.15, length, 16]}
        position={[midPoint.x, midPoint.y, midPoint.z]}
        rotation={new THREE.Euler().setFromRotationMatrix(orientation)}
        material={shaderMaterial}
      />
    );
  };
  

  return (
    <Canvas
      style={{
        width: "100%",
        height: "1000px",
      }}
      camera={{ position: [0, 0, 15], fov: 60 }}
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />

      <group rotation={[0, Math.PI, 0]}>
        {handData.map((hand, handIndex) => {
          const modifiedHand = generatePalmPoints([...hand]);

          return (
            <React.Fragment key={`hand-${handIndex}`}>
              {palmConnections.map(([start, end], idx) => (
                <React.Fragment key={`palm-${handIndex}-${idx}`}>
                  {generateCylinder(modifiedHand[start], modifiedHand[end])}
                </React.Fragment>
              ))}

              {fingerSegments.map(([start, end], idx) => (
                <React.Fragment key={`finger-${handIndex}-${idx}`}>
                  {generateCylinder(modifiedHand[start], modifiedHand[end])}
                </React.Fragment>
              ))}

              {modifiedHand.slice(1).map((landmark, idx) => (
                <Sphere
                  key={`joint-${handIndex}-${idx + 1}`}
                  args={[0.12, 32, 32]}
                  position={[landmark.x * 8 - 5.4, -landmark.y * 8 + 4.4, -landmark.z * 8 - 2]}
                  material={new THREE.MeshStandardMaterial({ color: "#703764" })}
                />
              ))}
            </React.Fragment>
          );
        })}
      </group>
    </Canvas>
  );
};

export default Hand3D;
