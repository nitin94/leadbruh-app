import React from 'react';

function CaptureTab({
  count,
  lastCapture,
  isProcessing,
  showUndo,
  onUndo,
  onVoiceStart,
  onCameraOpen,
  onTextOpen,
  pendingLeadName,
  onCancelAppend,
  onAddMoreDetails
}) {
  const isEmpty = count === 0 && !isProcessing && !lastCapture;

  return (
    <div className="capture-tab">
      {pendingLeadName && (
        <div className="append-mode-banner">
          <div className="append-mode-text">
            <span className="append-mode-label">Adding to:</span>
            <span className="append-mode-lead">{pendingLeadName}</span>
          </div>
          <button className="append-mode-cancel" onClick={onCancelAppend}>
            Cancel
          </button>
        </div>
      )}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="lead-counter">
          <div className="counter-number">{count}</div>
          <div className="counter-label">leads</div>

          <ConfirmationCard
            lead={lastCapture}
            isProcessing={isProcessing}
            showUndo={showUndo}
            onUndo={onUndo}
            onAddMoreDetails={onAddMoreDetails}
          />
        </div>
      )}

      <div className="capture-buttons">
        <div className="primary-buttons">
          <button 
            className="capture-btn voice" 
            onClick={onVoiceStart}
            disabled={isProcessing}
          >
            <MicIcon />
          </button>
          <button 
            className="capture-btn camera" 
            onClick={onCameraOpen}
            disabled={isProcessing}
          >
            <CameraIcon />
          </button>
        </div>
        <button 
          className="text-capture-btn" 
          onClick={onTextOpen}
          disabled={isProcessing}
        >
          <span className="text-icon">Aa</span>
          <span>Type a note</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-title">Start capturing</div>
      <div className="empty-state-hints">
        <div className="empty-state-hint">
          <span className="hint-icon">🎤</span>
          <span className="hint-text">Voice → describe who you just met</span>
        </div>
        <div className="empty-state-hint">
          <span className="hint-icon">📷</span>
          <span className="hint-text">Card → snap a business card</span>
        </div>
      </div>
    </div>
  );
}

function ConfirmationCard({ lead, isProcessing, showUndo, onUndo, onAddMoreDetails }) {
  if (isProcessing) {
    return (
      <div className="confirmation-card processing">
        <div className="confirmation-spinner"></div>
        <div className="confirmation-content">
          <div className="confirmation-title">Processing...</div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="confirmation-card success">
      <div className="confirmation-icon">✓</div>
      <div className="confirmation-content">
        <div className="confirmation-title">{lead.name || 'New Lead'}</div>
        {lead.company && <div className="confirmation-subtitle">{lead.company}</div>}
        {lead.email && <div className="confirmation-detail">{lead.email}</div>}
        {showUndo && (
          <div className="confirmation-actions">
            <button
              className="add-more-details-button"
              onClick={(e) => {
                e.stopPropagation();
                onAddMoreDetails(lead);
              }}
            >
              Add more details
            </button>
            <button className="undo-button" onClick={onUndo}>
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

export default CaptureTab;
