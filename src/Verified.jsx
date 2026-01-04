import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import Aurora from './Aurora';

const Verified = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Aurora Background */}
      <div className="absolute inset-0 aurora-bg">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-4">
        <div className="text-center max-w-md">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500/20 rounded-full backdrop-blur-sm">
              <FiCheckCircle 
                size={64} 
                className="text-green-400 drop-shadow-lg"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            E-mail zweryfikowany pomyślnie
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-100 drop-shadow-md leading-relaxed">
            Twoje konto jest już aktywne. Możesz teraz zamknąć to okno i wrócić do aplikacji.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verified;
