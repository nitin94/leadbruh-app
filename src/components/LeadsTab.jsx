import React, { useState, useMemo } from 'react';

function LeadsTab({ leads, onSwitchToCapture }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const q = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.name?.toLowerCase().includes(q) ||
      lead.company?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="leads-tab">
      <div className="search-bar">
        <SearchIcon />
        <input
          type="text"
          className="search-input"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <CloseIcon />
          </button>
        )}
      </div>

      {filteredLeads.length === 0 ? (
        <div className="leads-empty">
          <div className="leads-empty-icon">
            {leads.length === 0 ? '📋' : '🔍'}
          </div>
          <div className="leads-empty-text">
            {leads.length === 0 ? 'No leads yet' : 'No results found'}
          </div>
          {leads.length === 0 && (
            <button className="leads-empty-cta" onClick={onSwitchToCapture}>
              Capture your first lead
            </button>
          )}
        </div>
      ) : (
        <div className="leads-list">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              expanded={expandedId === lead.id}
              onToggle={() => toggleExpand(lead.id)}
            />
          ))}
        </div>
      )}

      {/* FAB to switch to capture */}
      <button className="fab" onClick={onSwitchToCapture}>
        <PlusIcon />
      </button>
    </div>
  );
}

function LeadCard({ lead, expanded, onToggle }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getConfidenceClass = (confidence) => {
    if (!confidence) return 'medium';
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  };

  return (
    <div className={`lead-card ${expanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="lead-card-header">
        <div className="lead-card-name">{lead.name || 'Unknown'}</div>
        <span className={`confidence-dot ${getConfidenceClass(lead.confidence)}`}>
          {lead.confidence >= 0.9 ? '●' : lead.confidence >= 0.7 ? '◐' : '○'}
        </span>
      </div>
      
      {lead.company && <div className="lead-card-company">{lead.company}</div>}
      
      <div className="lead-card-time">{formatTime(lead.createdAt)}</div>

      {expanded && (
        <div className="lead-card-details">
          {lead.email && (
            <div className="lead-detail-row">
              <span className="lead-detail-label">Email</span>
              <a href={`mailto:${lead.email}`} className="lead-detail-value link" onClick={e => e.stopPropagation()}>
                {lead.email}
              </a>
            </div>
          )}
          
          {lead.phone && (
            <div className="lead-detail-row">
              <span className="lead-detail-label">Phone</span>
              <a href={`tel:${lead.phone}`} className="lead-detail-value link" onClick={e => e.stopPropagation()}>
                {lead.phone}
              </a>
            </div>
          )}
          
          {lead.title && (
            <div className="lead-detail-row">
              <span className="lead-detail-label">Title</span>
              <span className="lead-detail-value">{lead.title}</span>
            </div>
          )}
          
          {lead.notes && (
            <div className="lead-detail-row">
              <span className="lead-detail-label">Notes</span>
              <span className="lead-detail-value notes">{lead.notes}</span>
            </div>
          )}

          {lead.sources && lead.sources.length > 0 && (
            <div className="lead-sources">
              <span className="lead-detail-label">Sources</span>
              <div className="source-tags">
                {lead.sources.map((source, i) => (
                  <span key={i} className="source-tag">
                    {source.type === 'voice' ? '🎤' : source.type === 'card' ? '📷' : '⌨️'}
                    {' '}
                    {formatTime(source.timestamp)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

export default LeadsTab;
