import React from "react";
import "./CSS/About.css";
import Omid from "./CSS/Images/Omid.png";
import Mark from "./CSS/Images/Mark.png";
import SDG4 from "./CSS/Images/SDG4.png";
import SDG10 from "./CSS/Images/SDG10.png";
import Navbar from "./Navbar";
import Footer from "./Footer";

const About = () => {
  return (
    <div className="about-container">
      <Navbar />

      <h1 className="about-title">About OrchestrAir</h1>
      <p className="about-description">
        <strong>OrchestrAir</strong> is a revolutionary platform designed to make music accessible to everyone. Whether you're a beginner or an expert, this tool empowers individuals, including disabled and underprivileged communities, to learn and play instruments for free, anywhere and anytime.
      </p>
      <p className="about-mission">
        Our mission is to bridge the gap in music education and bring the joy of music to everyone, irrespective of their background or circumstances.
      </p>

      <h2 className="sdg-title">Our Commitment to the UN Sustainable Development Goals</h2>
      <div className="sdg-container">
        <div className="sdg">
          <img src={SDG4} alt="SDG 4: Quality Education" className="sdg-image" />
          <p className="sdg-description">
            <strong>SDG 4: Quality Education</strong> - We aim to provide inclusive and equitable quality education by making music education accessible to all, regardless of their financial or physical limitations.
          </p>
        </div>
        <div className="sdg">
          <img src={SDG10} alt="SDG 10: Reduced Inequalities" className="sdg-image" />
          <p className="sdg-description">
            <strong>SDG 10: Reduced Inequalities</strong> - Our platform empowers marginalized communities and individuals with disabilities to participate in the universal joy of music, reducing inequalities through innovative technology.
          </p>
        </div>
      </div>

      <h2 className="developers-title">Meet the Developers</h2>
      <div className="developers">
        <div className="developer">
          <img src={Omid} alt="Omid Latifi" className="developer-image" />
          <h3 className="developer-name">Omid Latifi</h3>
          <p className="developer-description">
            Omid is a passionate software developer committed to creating innovative solutions for real-world challenges. With expertise in web development and a love for music, he co-developed Digital Instrument to make music accessible to all.
          </p>
        </div>
        <div className="developer">
          <img src={Mark} alt="Mark Kogan" className="developer-image" />
          <h3 className="developer-name">Mark Kogan</h3>
          <p className="developer-description">
            Mark is a skilled developer and music enthusiast. He believes in leveraging technology to break barriers, and his contributions to Digital Instrument reflect his dedication to social impact through innovation.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
