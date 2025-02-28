import React from "react";
import { PiLightbulbFilamentDuotone } from "react-icons/pi";

const WelcomeHeader = () => {
  return (
    <div className="flex justify-center items-center gap-1">
      <PiLightbulbFilamentDuotone
        color="#FBAB57"
        className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20"
      />
      <div className="text-center py-12 space-y-1">
        <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold">
          Hi, I&apos;m Imole
        </h1>
        <p className="text-gray-600 tracking-widest text-xs sm:text-sm md:text-base lg:text-lg">
          How can I help you today?
        </p>
      </div>
    </div>
  );
};

export default React.memo(WelcomeHeader);
