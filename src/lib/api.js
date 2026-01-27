// API client for Supabase Edge Functions
// Replace SUPABASE_URL with your actual Supabase project URL

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ciqheaowpesxsytocarh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const API_TIMEOUT = 30000; // 30 second timeout for API calls

class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// Helper to add timeout to fetch requests
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout. Please check your connection and try again.', 408, 'TIMEOUT');
    }
    throw error;
  }
}

// Helper to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.message || 'API request failed',
      response.status,
      error.code
    );
  }
  return response.json();
}

// Convert audio blob to base64
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Compress image before sending
async function compressImage(blob, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => resolve(compressedBlob),
        'image/jpeg',
        0.8
      );
    };

    img.src = URL.createObjectURL(blob);
  });
}

export const api = {
  /**
   * Transcribe audio using OpenAI Whisper
   * @param {Blob} audioBlob - Audio blob from MediaRecorder
   * @returns {Promise<{transcript: string}>}
   */
  async transcribe(audioBlob) {
    const base64Audio = await blobToBase64(audioBlob);

    const response = await fetchWithTimeout(`${FUNCTIONS_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        audio: base64Audio,
        mimeType: audioBlob.type || 'audio/webm'
      })
    });

    return handleResponse(response);
  },

  /**
   * Extract lead data from business card image
   * @param {Blob} imageBlob - Image blob from camera
   * @returns {Promise<{name, company, email, phone, title, raw}>}
   */
  async extractCard(imageBlob) {
    // Compress image first
    const compressedBlob = await compressImage(imageBlob);
    const base64Image = await blobToBase64(compressedBlob);

    const response = await fetchWithTimeout(`${FUNCTIONS_URL}/extract-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        image: base64Image
      })
    });

    return handleResponse(response);
  },

  /**
   * Extract structured lead from raw text
   * @param {string} text - Raw text (transcript or typed note)
   * @returns {Promise<{name, company, email, phone, notes}>}
   */
  async extractLead(text) {
    const response = await fetchWithTimeout(`${FUNCTIONS_URL}/extract-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ text })
    });

    return handleResponse(response);
  },

  /**
   * Process voice capture end-to-end
   * @param {Blob} audioBlob - Audio blob
   * @returns {Promise<{lead, transcript}>}
   */
  async processVoice(audioBlob) {
    // Step 1: Transcribe
    const { transcript } = await this.transcribe(audioBlob);
    
    if (!transcript || transcript.trim().length === 0) {
      throw new APIError('Could not transcribe audio. Please try again.', 400, 'EMPTY_TRANSCRIPT');
    }

    // Step 2: Extract lead from transcript
    const lead = await this.extractLead(transcript);

    return {
      lead: {
        ...lead,
        sources: [{
          type: 'voice',
          timestamp: new Date().toISOString(),
          transcript
        }]
      },
      transcript
    };
  },

  /**
   * Process card capture end-to-end
   * @param {Blob} imageBlob - Image blob
   * @returns {Promise<{lead, imageUrl}>}
   */
  async processCard(imageBlob) {
    // Extract lead from card image
    const lead = await this.extractCard(imageBlob);

    // Create local URL for the image
    const imageUrl = URL.createObjectURL(imageBlob);

    return {
      lead: {
        ...lead,
        sources: [{
          type: 'card',
          timestamp: new Date().toISOString(),
          imageUrl
        }]
      },
      imageUrl
    };
  },

  /**
   * Process text capture
   * @param {string} text - Typed text
   * @returns {Promise<{lead}>}
   */
  async processText(text) {
    const lead = await this.extractLead(text);

    return {
      lead: {
        ...lead,
        sources: [{
          type: 'text',
          timestamp: new Date().toISOString(),
          text
        }]
      }
    };
  },

  /**
   * Check if API is reachable
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await fetch(`${FUNCTIONS_URL}/health`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

export { APIError };
export default api;
