import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const Verified = () => {
  return (
    <div key="verified-container" className="relative w-full h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none fixed -top-48 -left-48" />
        <div className="w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none fixed -bottom-32 -right-32" />
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
