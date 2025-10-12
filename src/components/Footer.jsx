import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-[#3B0304] bg-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-2 text-[#3B0304] text-xs">
        <p className="text-center sm:text-left">
          © 2025 TaskSphere IT - All Rights Reserved
        </p>
        <Link
          to="/TermsOfService"
          className="hover:underline hover:text-[#5b0a0b] transition-colors"
        >
          Terms of Service
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
