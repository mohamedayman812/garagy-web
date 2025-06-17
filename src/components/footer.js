import React from 'react';
import { FaFacebookF, FaInstagram, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container text-center">
        <h5 className="mb-2">Garagy Parking Management System</h5>
        <p className="mb-3">Smart parking made simple, secure and seamless.</p>

        <div className="social-icons d-flex justify-content-center gap-4 mb-3">
          <a href="https://facebook.com/yourpage" target="_blank" rel="noopener noreferrer" className="text-white" aria-label="Facebook">
            <FaFacebookF size={20} />
          </a>
          <a href="https://instagram.com/yourprofile" target="_blank" rel="noopener noreferrer" className="text-white" aria-label="Instagram">
            <FaInstagram size={20} />
          </a>
          <a href="mailto:support@garagy.com" className="text-white" aria-label="Email">
            <FaEnvelope size={20} />
          </a>
        </div>

        <div className="mb-2">
          <a href="/contact" className="text-white text-decoration-underline">Contact Us</a>
        </div>

        <small>&copy; {new Date().getFullYear()} Garagy. All rights reserved.</small>
      </div>
    </footer>
  );
};

export default Footer;
