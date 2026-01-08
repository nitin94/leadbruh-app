/**
 * Utilities for saving photos to device gallery
 */

/**
 * Save a blob as an image file to the device
 * @param {Blob} blob - Image blob to save
 * @param {string} filename - Filename (optional)
 * @returns {Promise<void>}
 */
export async function savePhotoToDevice(blob, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const finalFilename = filename || `business-card-${timestamp}.jpg`;

  // For modern browsers with File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: finalFilename,
        types: [{
          description: 'Images',
          accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled, not an error
        return;
      }
      console.warn('File System Access API failed, falling back to download:', err);
    }
  }

  // Fallback: Use download link (works on all browsers and mobile)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Share photo via native share sheet (mobile)
 * @param {Blob} blob - Image blob to share
 * @param {string} title - Share title
 * @returns {Promise<boolean>} - True if shared successfully
 */
export async function sharePhoto(blob, title = 'Business Card') {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  try {
    const file = new File([blob], `${title}.jpg`, { type: 'image/jpeg' });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title,
        text: 'Business card captured with LeadBruh'
      });
      return true;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // User cancelled, not an error
      return false;
    }
    console.error('Share failed:', err);
    return false;
  }

  return false;
}

/**
 * Save photo with automatic fallback to best available method
 * @param {Blob} blob - Image blob to save
 * @param {string} filename - Optional filename
 * @param {boolean} tryShare - Try native share on mobile first
 * @returns {Promise<{method: string, success: boolean}>}
 */
export async function autoSavePhoto(blob, filename, tryShare = true) {
  // On mobile, try native share first if requested
  if (tryShare && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const shared = await sharePhoto(blob, filename?.replace('.jpg', ''));
    if (shared) {
      return { method: 'share', success: true };
    }
  }

  // Save to device
  await savePhotoToDevice(blob, filename);
  return { method: 'download', success: true };
}

export default {
  savePhotoToDevice,
  sharePhoto,
  autoSavePhoto
};
