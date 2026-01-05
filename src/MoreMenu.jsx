import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';

/**
 * MoreMenu Component
 * Vertical dots menu for secondary actions
 * Prevents main workout view clutter
 */
const MoreMenu = ({ items, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (item) => {
    // Support both direct onClick and onItemClick callback
    if (item.onClick) {
      item.onClick();
    } else if (onItemClick) {
      onItemClick(item);
    }
    setIsOpen(false);
  };

  return (
    <div className="more-menu" ref={menuRef}>
      <button
        className="more-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="More options"
      >
        <MoreVertical size={20} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="more-menu-dropdown">
          {items.map((item, idx) => {
            const IconComponent = item.icon;
            return (
            <button
              key={idx}
              className={`more-menu-item more-menu-item-${item.variant || 'default'}`}
              onClick={() => handleItemClick(item)}
            >
              {IconComponent && <IconComponent size={18} strokeWidth={2} className="more-menu-icon" />}
              <span className="more-menu-label">{item.label}</span>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoreMenu;

// Add styling for MoreMenu
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .more-menu {
      position: relative;
      display: inline-block;
    }

    .more-menu-trigger {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      min-width: 44px;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;
    }

    .more-menu-trigger:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .more-menu-trigger:active {
      transform: scale(0.95);
    }

    .more-menu-dropdown {
      position: absolute;
      right: 0;
      top: 100%;
      margin-top: 0.5rem;
      background: rgba(20, 20, 22, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      min-width: 160px;
      z-index: 100;
      animation: slideDown 0.15s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .more-menu-item {
      width: 100%;
      padding: 0.875rem 1rem;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .more-menu-item:last-child {
      border-bottom: none;
    }

    .more-menu-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .more-menu-item:active {
      transform: scale(0.98);
    }

    .more-menu-item-danger {
      color: #ef4444;
    }

    .more-menu-item-danger:hover {
      background-color: rgba(239, 68, 68, 0.2);
    }

    .more-menu-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
    }

    .more-menu-label {
      flex: 1;
    }
  `;
  document.head.appendChild(style);
}
