import React from "react";
import { Link } from "react-router-dom";
import "./CSS/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🎹 OrchestrAir
        </Link>
        <ul className="navbar-links">
          <li>
            <Link to="/Instrument">Instrument</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
          <Link to="/albumcovers">Album Covers</Link>
          </li>
          <li>
            <a href="/tutorial">Tutorial</a>
          </li>
        </ul>
        <Link to="#get-started" className="navbar-cta">
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
