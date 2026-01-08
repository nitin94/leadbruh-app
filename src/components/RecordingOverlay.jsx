import React from 'react';

function RecordingOverlay({ duration, onStop, onCancel }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recording-overlay" onClick={onStop}>
      <div className="recording-header">
        <span className="recording-dot">●</span>
        <span className="recording-time">{formatDuration(duration)}</span>
      </div>
      
      <div className="recording-content">
        <div className="recording-visualizer">
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
        </div>
        
        <div className="recording-label">Recording...</div>
        
        <button className="stop-button" onClick={onStop}>
          <span className="stop-icon">■</span>
          Stop
        </button>
        
        <button className="cancel-recording" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default RecordingOverlay;
