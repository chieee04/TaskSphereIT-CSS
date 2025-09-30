// SigninHeader.jsx
import React from "react";
import Logo from "../../assets/img/Logo.png";

const SigninHeader = () => {
  return (
    <div
      className="mb-3 px-4 py-2"
      style={{
        backgroundColor: "rgba(240, 240, 240, 0.4)",
        borderBottomLeftRadius: "14px",
        borderBottomRightRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        position: "relative",
      }}
    >
      <a href="/" style={{ display: "inline-block" }}>
        <img src={Logo} width="150" height="120" alt="Logo" />
      </a>
    </div>
  );
};

export default SigninHeader;
