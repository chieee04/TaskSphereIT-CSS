import React from "react";

const SigninFoot = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white z-10">
      {/* Reduced gradient height */}
      <div className="h-8 sm:h-12 w-full bg-gradient-to-t from-[#611A11]/20 to-transparent" />
      
      {/* Red divider line */}
      <div className="mx-4 sm:mx-6 md:mx-8 h-[1px] sm:h-[2px] bg-[#3B0304]" />
      
      {/* Footer content */}
      <div className="mx-4 sm:mx-6 md:mx-8 flex flex-col items-center justify-between gap-1 py-2 text-xs sm:text-sm text-[#3B0304] md:flex-row">
        <p>©2025 TaskSphere IT - All Rights Reserved</p>
        <a href="#" className="hover:underline">Terms of Service</a>
      </div>
    </footer>
  );
};

export default SigninFoot;