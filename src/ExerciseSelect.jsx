import React, { useState, useRef, useEffect } from 'react';

// Fuzzy search function - allows typos and partial matches
const fuzzySearch = (searchTerm, options) => {
  if (!searchTerm) return options;

  const search = searchTerm.toLowerCase();
  
  return options
    .map(option => {
      const optionLower = option.toLowerCase();
      
      // Exact match
      if (optionLower === search) return { option, score: 1000 };
      
      // Starts with search
      if (optionLower.startsWith(search)) return { option, score: 100 };
      
      // Contains search
      if (optionLower.includes(search)) return { option, score: 50 };
      
      // Fuzzy match - check if characters appear in order
      let searchIndex = 0;
      let score = 0;
      for (let i = 0; i < optionLower.length && searchIndex < search.length; i++) {
        if (optionLower[i] === search[searchIndex]) {
          searchIndex++;
          score += 10;
        }
      }
      
      // If all search characters found in order, return with score
      if (searchIndex === search.length) {
        return { option, score };
      }
      
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => b.score - a.score)
    .map(item => item.option);
};

const ExerciseSelect = ({ value, onChange, options, placeholder = "Select Exercise" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = fuzzySearch(searchTerm, options);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="exercise-select-wrapper" ref={dropdownRef}>
      <div
        className={`exercise-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'selected' : 'placeholder'}>
          {value || placeholder}
        </span>
        <span className="select-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="exercise-select-dropdown">
          <input
            type="text"
            className="exercise-search"
            placeholder="Search exercise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="exercise-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`exercise-option ${value === option ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="exercise-option disabled">No exercises found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseSelect;
