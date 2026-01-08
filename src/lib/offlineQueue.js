import { pendingDB, leadsDB } from './db';
import api from './api';

class OfflineQueue {
  constructor() {
    this.isProcessing = false;
    this.listeners = new Set();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('offline', () => this.notifyListeners());
    }
  }

  // Subscribe to queue changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  // Check if we're online
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Add a capture to the queue
   * @param {'voice' | 'card' | 'text'} type 
   * @param {Object} data - { audioBlob, imageBlob, or text }
   */
  async addToQueue(type, data) {
    // Serialize blobs to base64 for storage
    let serializedData = { ...data };
    
    if (data.audioBlob) {
      serializedData.audioBase64 = await this.blobToBase64(data.audioBlob);
      serializedData.audioType = data.audioBlob.type;
      delete serializedData.audioBlob;
    }
    
    if (data.imageBlob) {
      serializedData.imageBase64 = await this.blobToBase64(data.imageBlob);
      serializedData.imageType = data.imageBlob.type;
      delete serializedData.imageBlob;
    }

    const id = await pendingDB.add(type, serializedData);
    this.notifyListeners();
    
    // Try to process immediately if online
    if (this.isOnline()) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process all pending captures
   */
  async processQueue() {
    if (this.isProcessing || !this.isOnline()) return;
    
    this.isProcessing = true;
    this.notifyListeners();

    try {
      const pending = await pendingDB.getAll();
      
      for (const capture of pending) {
        try {
          await pendingDB.markProcessing(capture.id);
          this.notifyListeners();

          const lead = await this.processCapture(capture);
          
          if (lead) {
            await leadsDB.add(lead);
          }
          
          await pendingDB.markComplete(capture.id);
          this.notifyListeners();
        } catch (error) {
          console.error('Failed to process capture:', error);
          await pendingDB.markFailed(capture.id, error);
          this.notifyListeners();
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  /**
   * Process a single capture
   */
  async processCapture(capture) {
    const { type, data } = capture;

    switch (type) {
      case 'voice': {
        const audioBlob = this.base64ToBlob(data.audioBase64, data.audioType);
        const result = await api.processVoice(audioBlob);
        return result.lead;
      }
      
      case 'card': {
        const imageBlob = this.base64ToBlob(data.imageBase64, data.imageType);
        const result = await api.processCard(imageBlob);
        return result.lead;
      }
      
      case 'text': {
        const result = await api.processText(data.text);
        return result.lead;
      }
      
      default:
        throw new Error(`Unknown capture type: ${type}`);
    }
  }

  /**
   * Retry a failed capture
   */
  async retry(id) {
    await pendingDB.retry(id);
    this.notifyListeners();
    
    if (this.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Get queue status
   */
  async getStatus() {
    const pending = await pendingDB.getAll();
    return {
      count: pending.length,
      isProcessing: this.isProcessing,
      isOnline: this.isOnline(),
      items: pending
    };
  }

  // Helper: Blob to Base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Helper: Base64 to Blob
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();
export default offlineQueue;
