import React from "react";
import Logo from "../../assets/img/Logo.png";

const SigninHead = () => {
  return (
    <header className="w-full bg-white border-b border-neutral-200 shadow-sm">
      <div className="h-[100px] flex items-center justify-start px-6">
        <img src={Logo} alt="TaskSphere IT" className="h-12 md:h-14 w-auto ml-2" />
      </div>
    </header>
  );
};

export default SigninHead;
