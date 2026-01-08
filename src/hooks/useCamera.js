import { useState, useRef, useCallback, useEffect } from 'react';

export function useCamera() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Check for camera availability
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasVideo = devices.some(d => d.kind === 'videoinput');
          setHasCamera(hasVideo);
        })
        .catch(() => setHasCamera(false));
    }
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      setIsOpen(true);

      return stream;
    } catch (err) {
      console.error('Camera error:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setHasCamera(false);
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Could not access camera. Please try again.');
      }

      throw err;
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const captureImage = useCallback(async () => {
    if (!streamRef.current || !videoRef.current) {
      throw new Error('Camera not initialized');
    }

    const video = videoRef.current;
    
    // Create canvas if not exists
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture image'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  }, []);

  // Set video element ref
  const setVideoRef = useCallback((element) => {
    videoRef.current = element;
    
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isOpen,
    error,
    permissionDenied,
    hasCamera,
    openCamera,
    closeCamera,
    captureImage,
    setVideoRef,
    stream: streamRef.current
  };
}

export default useCamera;
