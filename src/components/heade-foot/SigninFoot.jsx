import React from "react";

const SigninFoot = () => {
  return (
    // Fixed footer so it doesn't add to page height
    <footer className="fixed bottom-0 left-0 right-0 bg-white">
      {/* Full-width gradient directly above the red divider */}
      <div className="h-24 w-full bg-gradient-to-t from-[#611A11]/30 to-transparent" />

      {/* Red divider line (inset like your mock) */}
      <div className="mx-[0.3in] h-[2px] bg-[#3B0304]" />

      {/* Footer content */}
      <div className="mx-[0.3in] flex flex-col items-center justify-between gap-2 py-3 text-[14px] text-[#3B0304] md:flex-row">
        <p>©2025 TaskSphere IT - All Rights Reserved</p>
        <a href="#" className="hover:underline">Terms of Service</a>
      </div>
    </footer>
  );
};

export default SigninFoot;
