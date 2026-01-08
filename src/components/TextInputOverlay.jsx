import React, { useState, useRef, useEffect } from 'react';

function TextInputOverlay({ onSubmit, onClose }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    // Focus and open keyboard
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="text-input-overlay">
      <div className="text-input-header">
        <button className="text-cancel" onClick={onClose}>
          Cancel
        </button>
        <span className="text-title">Add Note</span>
        <button 
          className="text-done" 
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          Done
        </button>
      </div>
      
      <textarea
        ref={textareaRef}
        className="text-input-field"
        placeholder="Maya from Stripe, wants enterprise demo, follow up next week..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      <div className="text-input-hint">
        Describe who you met and any details you want to remember
      </div>
    </div>
  );
}

export default TextInputOverlay;
