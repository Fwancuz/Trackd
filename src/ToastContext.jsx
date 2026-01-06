/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Check, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutRefsMap = useRef(new Map());
  const mountedRef = useRef(false);

  const removeToast = (id) => {
    // Clear any pending timeout for this toast
    if (timeoutRefsMap.current.has(id)) {
      clearTimeout(timeoutRefsMap.current.get(id));
      timeoutRefsMap.current.delete(id);
    }

    if (!mountedRef.current) return;
    setToasts(prev => {
      const exists = prev.some(t => t.id === id);
      if (!exists) return prev;
      return prev.filter(t => t.id !== id);
    });
  };

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };

    if (!mountedRef.current) return id;
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      // Use setTimeout with callback through requestAnimationFrame for safe removal
      const timeoutId = setTimeout(() => {
        removeToast(id);
      }, duration);
      
      // Store timeout reference for cleanup
      timeoutRefsMap.current.set(id, timeoutId);
    }
    
    return id;
  };

  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const info = (message, duration) => showToast(message, 'info', duration);

  // Cleanup function to clear all timeouts on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timeoutRefsMap.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefsMap.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, info }}>
      {children}
      <div className="toast-container" role="region" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div key={`toast-${toast.id}`} className={`toast-notification toast-${toast.type}`}>
            <div className="toast-content">
              <div className="toast-icon">
                {toast.type === 'success' && <Check size={18} strokeWidth={2} />}
                {toast.type === 'error' && <X size={18} strokeWidth={2} />}
                {toast.type === 'info' && <Info size={18} strokeWidth={2} />}
              </div>
              <span className="toast-message">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
