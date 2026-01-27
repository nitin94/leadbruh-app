import React, { useState, useEffect, useCallback } from 'react';
import { useLeads } from './hooks/useLeads';
import { useRecorder } from './hooks/useRecorder';
import { useCamera } from './hooks/useCamera';
import { offlineQueue } from './lib/offlineQueue';
import api from './lib/api';
import { exportToCSV, exportToExcel } from './lib/export';
import { mergeLead } from './lib/utils';
import './App.css';

// Components
import CaptureTab from './components/CaptureTab';
import LeadsTab from './components/LeadsTab';
import RecordingOverlay from './components/RecordingOverlay';
import CameraOverlay from './components/CameraOverlay';
import TextInputOverlay from './components/TextInputOverlay';
import ExportModal from './components/ExportModal';
import EditLeadModal from './components/EditLeadModal';
import Toast from './components/Toast';

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState('capture');
  
  // Overlay states
  const [showTextInput, setShowTextInput] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Append mode state (for multi-modal input)
  const [pendingLeadId, setPendingLeadId] = useState(null);
  const [pendingLeadName, setPendingLeadName] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCapture, setLastCapture] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState(null);
  
  // Toast notifications
  const [toast, setToast] = useState(null);
  
  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Hooks
  const { leads, addLead, updateLead, deleteLead, count, refresh } = useLeads();
  const recorder = useRecorder();
  const camera = useCamera();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show toast helper
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Handle voice recording stop
  const handleRecordingStop = useCallback(async () => {
    try {
      const audioBlob = await recorder.stopRecording();
      setIsProcessing(true);
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);

      if (!isOnline) {
        // Queue for later processing
        await offlineQueue.addToQueue('voice', { audioBlob });
        showToast('Saved offline. Will process when back online.', 'info');
        setIsProcessing(false);
        return;
      }

      // Process voice capture
      const { lead } = await api.processVoice(audioBlob);

      let savedLead;
      if (pendingLeadId) {
        // Append mode: merge with existing lead
        await refresh();
        const freshLeads = await refresh();
        const existingLead = freshLeads?.find(l => l.id === pendingLeadId);
        if (existingLead) {
          const merged = mergeLead(existingLead, lead);
          await updateLead(pendingLeadId, merged);
          savedLead = { ...existingLead, ...merged };
          showToast(`Updated ${pendingLeadName}`, 'success');
          // Exit append mode
          setPendingLeadId(null);
          setPendingLeadName('');
        } else {
          // Lead not found, create new
          savedLead = await addLead(lead);
        }
      } else {
        // Normal mode: create new lead
        savedLead = await addLead(lead);
      }

      setLastCapture(savedLead);
      setShowUndo(true);

      // Clear undo after 10 seconds
      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setShowUndo(false), 10000);
      setUndoTimer(timer);

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

    } catch (error) {
      console.error('Voice processing error:', error);
      showToast(error.message || 'Failed to process voice note', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [recorder, isOnline, addLead, updateLead, refresh, pendingLeadId, pendingLeadName, showToast, undoTimer]);

  // Handle camera capture
  const handleCameraCapture = useCallback(async (imageBlob) => {
    setShowCamera(false);
    setIsProcessing(true);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      if (!isOnline) {
        await offlineQueue.addToQueue('card', { imageBlob });
        showToast('Saved offline. Will process when back online.', 'info');
        setIsProcessing(false);
        return;
      }

      const { lead } = await api.processCard(imageBlob);

      let savedLead;
      if (pendingLeadId) {
        // Append mode: merge with existing lead
        // Get fresh lead data from database instead of using stale leads array
        await refresh();
        const freshLeads = await refresh();
        const existingLead = freshLeads?.find(l => l.id === pendingLeadId);
        if (existingLead) {
          const merged = mergeLead(existingLead, lead);
          await updateLead(pendingLeadId, merged);
          savedLead = { ...existingLead, ...merged };
          showToast(`Updated ${pendingLeadName}`, 'success');
          // Exit append mode
          setPendingLeadId(null);
          setPendingLeadName('');
        } else {
          // Lead not found, create new
          savedLead = await addLead(lead);
        }
      } else {
        // Normal mode: create new lead
        savedLead = await addLead(lead);
      }

      setLastCapture(savedLead);
      setShowUndo(true);

      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setShowUndo(false), 10000);
      setUndoTimer(timer);

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

    } catch (error) {
      console.error('Card processing error:', error);
      showToast(error.message || 'Failed to process card', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, addLead, updateLead, refresh, pendingLeadId, pendingLeadName, showToast, undoTimer]);

  // Handle text capture
  const handleTextCapture = useCallback(async (text) => {
    setShowTextInput(false);
    setIsProcessing(true);
    
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      if (!isOnline) {
        await offlineQueue.addToQueue('text', { text });
        showToast('Saved offline. Will process when back online.', 'info');
        setIsProcessing(false);
        return;
      }

      const { lead } = await api.processText(text);

      let savedLead;
      if (pendingLeadId) {
        // Append mode: merge with existing lead
        await refresh();
        const freshLeads = await refresh();
        const existingLead = freshLeads?.find(l => l.id === pendingLeadId);
        if (existingLead) {
          const merged = mergeLead(existingLead, lead);
          await updateLead(pendingLeadId, merged);
          savedLead = { ...existingLead, ...merged };
          showToast(`Updated ${pendingLeadName}`, 'success');
          // Exit append mode
          setPendingLeadId(null);
          setPendingLeadName('');
        } else {
          // Lead not found, create new
          savedLead = await addLead(lead);
        }
      } else {
        // Normal mode: create new lead
        savedLead = await addLead(lead);
      }

      setLastCapture(savedLead);
      setShowUndo(true);

      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setShowUndo(false), 10000);
      setUndoTimer(timer);

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

    } catch (error) {
      console.error('Text processing error:', error);
      showToast(error.message || 'Failed to process note', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, addLead, updateLead, refresh, pendingLeadId, pendingLeadName, showToast, undoTimer]);

  // Handle undo
  const handleUndo = useCallback(async () => {
    if (!lastCapture) return;
    
    try {
      await deleteLead(lastCapture.id);
      setLastCapture(null);
      setShowUndo(false);
      if (undoTimer) clearTimeout(undoTimer);
      showToast('Lead removed', 'info');
    } catch (error) {
      console.error('Undo error:', error);
      showToast('Failed to undo', 'error');
    }
  }, [lastCapture, deleteLead, undoTimer, showToast]);

  // Handle export
  const handleExport = useCallback((format) => {
    try {
      if (format === 'csv') {
        exportToCSV(leads);
      } else {
        exportToExcel(leads);
      }
      setShowExport(false);
      showToast(`Exported ${leads.length} leads`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed', 'error');
    }
  }, [leads, showToast]);

  // Handle edit lead
  const handleEditLead = useCallback((lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  }, []);

  // Handle save edited lead
  const handleSaveEdit = useCallback(async (updates) => {
    if (!editingLead) return;

    try {
      await updateLead(editingLead.id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      setEditingLead(null);
      showToast('Lead updated', 'success');
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update lead', 'error');
    }
  }, [editingLead, updateLead, showToast]);

  // Handle start append mode
  const handleStartAppendMode = useCallback((lead) => {
    setPendingLeadId(lead.id);
    setPendingLeadName(lead.name || 'Unknown');
    setActiveTab('capture');
    showToast(`Adding details to ${lead.name || 'lead'}`, 'info');
  }, [showToast]);

  // Handle cancel append mode
  const handleCancelAppendMode = useCallback(() => {
    setPendingLeadId(null);
    setPendingLeadName('');
    showToast('Cancelled', 'info');
  }, [showToast]);

  // Handle delete lead
  const handleDeleteLead = useCallback(async (lead) => {
    const confirmed = window.confirm(
      `Delete ${lead.name || 'this lead'}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteLead(lead.id);
      showToast('Lead deleted', 'success');

      // If we were in append mode for this lead, exit append mode
      if (pendingLeadId === lead.id) {
        setPendingLeadId(null);
        setPendingLeadName('');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete lead', 'error');
    }
  }, [deleteLead, pendingLeadId, showToast]);

  // Open camera
  const handleOpenCamera = useCallback(async () => {
    try {
      await camera.openCamera();
      setShowCamera(true);
    } catch (error) {
      showToast(camera.error || 'Could not access camera', 'error');
    }
  }, [camera, showToast]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">leadbruh</div>
        <div className="header-right">
          {!isOnline && <span className="offline-badge">Offline</span>}
          {activeTab === 'leads' && count > 0 && (
            <button className="export-btn" onClick={() => setShowExport(true)}>
              <ExportIcon />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'capture' ? (
          <CaptureTab
            count={count}
            lastCapture={lastCapture}
            isProcessing={isProcessing}
            showUndo={showUndo}
            onUndo={handleUndo}
            onVoiceStart={recorder.startRecording}
            onCameraOpen={handleOpenCamera}
            onTextOpen={() => setShowTextInput(true)}
            pendingLeadName={pendingLeadName}
            onCancelAppend={handleCancelAppendMode}
            onAddMoreDetails={handleStartAppendMode}
          />
        ) : (
          <LeadsTab
            leads={leads}
            onSwitchToCapture={() => setActiveTab('capture')}
            onEdit={handleEditLead}
            onStartAppend={handleStartAppendMode}
            onDelete={handleDeleteLead}
          />
        )}
      </main>

      {/* Tab Bar */}
      <nav className="tab-bar">
        <button
          className={`tab ${activeTab === 'capture' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture')}
        >
          <CaptureIcon />
          <span className="tab-label">Capture</span>
        </button>
        <button
          className={`tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <LeadsIcon />
          <span className="tab-label">Leads</span>
          {count > 0 && <span className="tab-badge">{count}</span>}
        </button>
      </nav>

      {/* Overlays */}
      {recorder.isRecording && (
        <RecordingOverlay
          duration={recorder.duration}
          onStop={handleRecordingStop}
          onCancel={recorder.cancelRecording}
        />
      )}

      {showCamera && (
        <CameraOverlay
          onCapture={handleCameraCapture}
          onClose={() => {
            camera.closeCamera();
            setShowCamera(false);
            // Reset processing state if user closes camera during processing
            setIsProcessing(false);
          }}
          setVideoRef={camera.setVideoRef}
          captureImage={camera.captureImage}
        />
      )}

      {showTextInput && (
        <TextInputOverlay
          onSubmit={handleTextCapture}
          onClose={() => setShowTextInput(false)}
        />
      )}

      {showExport && (
        <ExportModal
          count={count}
          onExport={handleExport}
          onClose={() => setShowExport(false)}
        />
      )}

      {showEditModal && editingLead && (
        <EditLeadModal
          lead={editingLead}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false);
            setEditingLead(null);
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// Icons
function CaptureIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function LeadsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );
}

export default App;
