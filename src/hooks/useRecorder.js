import { useState, useRef, useCallback, useEffect } from 'react';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunks.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;

      // Determine best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      mediaRecorder.current = new MediaRecorder(stream, { mimeType });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError('Could not start recording. Please try again.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorder.current;

      if (!recorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      // Set up the stop handler
      recorder.onstop = () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Create blob from chunks
        const audioBlob = new Blob(audioChunks.current, {
          type: recorder.mimeType
        });

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setIsRecording(false);
        resolve(audioBlob);
      };

      recorder.onerror = (event) => {
        setIsRecording(false);
        reject(new Error('Recording error: ' + event.error?.message));
      };

      // Stop the recording (will trigger onstop above)
      try {
        recorder.stop();
      } catch (error) {
        // Only happens if already stopped or in wrong state
        setIsRecording(false);
        reject(new Error('No recording in progress'));
      }
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    audioChunks.current = [];
    setIsRecording(false);
    setDuration(0);
  }, []);

  return {
    isRecording,
    duration,
    error,
    permissionDenied,
    startRecording,
    stopRecording,
    cancelRecording
  };
}

export default useRecorder;
