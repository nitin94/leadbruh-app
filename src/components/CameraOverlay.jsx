import React, { useEffect, useState, useRef } from 'react';
import { autoSavePhoto } from '../lib/photoSaver';

function CameraOverlay({ onCapture, onClose, setVideoRef, captureImage }) {
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef.current);
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        setIsReady(true);
      };
    }
  }, [setVideoRef]);

  const handleCapture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      const imageBlob = await captureImage();

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);

      // Save photo to device gallery (non-blocking)
      autoSavePhoto(imageBlob, `business-card-${Date.now()}.jpg`, true)
        .then(result => {
          console.log('Photo saved:', result.method);
        })
        .catch(err => {
          console.error('Failed to save photo:', err);
          // Don't block the flow if save fails
        });

      // Pass to parent for processing
      onCapture(imageBlob);

      // Reset capturing state after triggering parent callback
      setIsCapturing(false);
    } catch (error) {
      console.error('Capture error:', error);
      setIsCapturing(false);
    }
  };

  return (
    <div className="camera-overlay">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />
      
      <div className="camera-ui">
        {/* Guide frame */}
        <div className="camera-guide">
          <div className="guide-corner top-left"></div>
          <div className="guide-corner top-right"></div>
          <div className="guide-corner bottom-left"></div>
          <div className="guide-corner bottom-right"></div>
        </div>
        
        {/* Instructions */}
        <div className="camera-instructions">
          {isReady ? 'Position card within frame' : 'Starting camera...'}
        </div>
        
        {/* Controls */}
        <div className="camera-controls">
          <button className="camera-close" onClick={onClose}>
            <CloseIcon />
          </button>
          
          <button 
            className={`camera-shutter ${isCapturing ? 'capturing' : ''}`}
            onClick={handleCapture}
            disabled={!isReady || isCapturing}
          >
            <div className="shutter-inner"></div>
          </button>
          
          <div className="camera-spacer"></div>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default CameraOverlay;
