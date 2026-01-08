import React from 'react';

function ExportModal({ count, onExport, onClose }) {
  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-title">Export {count} leads</div>
        
        <button className="export-option" onClick={() => onExport('csv')}>
          <span className="export-icon">📄</span>
          <div className="export-option-content">
            <span className="export-label">CSV</span>
            <span className="export-desc">Works with any spreadsheet app</span>
          </div>
        </button>
        
        <button className="export-option" onClick={() => onExport('excel')}>
          <span className="export-icon">📊</span>
          <div className="export-option-content">
            <span className="export-label">Excel</span>
            <span className="export-desc">Formatted .xlsx file</span>
          </div>
        </button>
        
        <button className="export-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ExportModal;
