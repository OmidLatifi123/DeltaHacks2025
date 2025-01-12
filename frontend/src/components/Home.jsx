import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import './CSS/Home.css';
import ElectricPianoModel from './3D-Models/ElectricPianoModel';
import DrumsModel from './3D-Models/Drums';
import Bird from './Bird'; 
import Footer from "./Footer";


function Home() {
  return (
    <div className="home-container">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="highlight">OrchestrAir</span>
          </h1>
          <div className="hero-right">
            <p className="hero-subtitle">
              Experience the harmony of technology and music like never before.
            </p>
            <button className="cta-button">Get Started</button>
          </div>
        </div>
      </header>

      <section className="features-section">
        <h2 className="section-title">Key Features</h2>

        <div className="features-content">
          {/* First Model Section */}
          <div className="features-model">
            <Canvas>
              <Suspense fallback={null}>
                <ElectricPianoModel />
                <OrbitControls enableZoom={false} enablePan={false} />
              </Suspense>
            </Canvas>
          </div>
          <div className="features-text">
            <h3>Revolutionize Your Music Experience</h3>
            <p>
              Discover the innovative capabilities of our digital instruments. With smart sensors,
              intuitive interfaces, and cloud connectivity, we bring creativity and technology together.
            </p>
          </div>
        </div>

        <div className="features-content">
          <div className="features-text">
            <h3>Innovate Your Music Journey</h3>
            <p>
              Our models enhance creativity with cutting-edge technology for the modern artist.
            </p>
            <p>
              Get ready to experience seamless performance with smart design and features.
            </p>
          </div>
          <div className="features-model">
            <Canvas>
              <Suspense fallback={null}>
                <DrumsModel />
                <OrbitControls enableZoom={false} enablePan={false} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </section>
      <Bird />
      <Footer/>
    </div>
  );
}

export default Home;
