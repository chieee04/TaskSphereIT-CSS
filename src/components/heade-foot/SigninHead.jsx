import React from "react";
import Logo from "../../assets/img/Logo.png";

const SigninHead = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 shadow-sm z-10">
      <div className="h-16 flex items-center justify-start px-4 sm:px-6">
        <img src={Logo} alt="TaskSphere IT" className="h-8 w-auto" />
      </div>
    </header>
  );
};

export default SigninHead;