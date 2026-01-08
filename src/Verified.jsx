import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const Verified = () => {
  return (
    <div key="verified-container" className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div style={{ 
          backgroundColor: `var(--accent)/10`,
          opacity: '0.3'
        }} className="w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none fixed -top-48 -left-48" />
        <div style={{ 
          backgroundColor: `var(--accent)/10`,
          opacity: '0.2'
        }} className="w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none fixed -bottom-32 -right-32" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-4">
        <div className="text-center max-w-md">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div style={{
              backgroundColor: `var(--accent)/20`,
              borderColor: 'var(--accent)'
            }} className="p-4 rounded-full backdrop-blur-sm border">
              <FiCheckCircle 
                size={64} 
                style={{ color: 'var(--accent)' }}
                className="drop-shadow-lg"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 style={{ color: 'var(--text)' }} className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
            E-mail zweryfikowany pomyślnie
          </h1>

          {/* Subtext */}
          <p style={{ color: 'var(--text)' }} className="text-lg md:text-xl drop-shadow-md leading-relaxed opacity-80">
            Twoje konto jest już aktywne. Możesz teraz zamknąć to okno i wrócić do aplikacji.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verified;
