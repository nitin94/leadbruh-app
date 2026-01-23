import React, { useState, useEffect } from 'react';

function EditLeadModal({ lead, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    title: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        title: lead.title || '',
        notes: lead.notes || ''
      });
    }
  }, [lead]);

  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = () => {
    const newErrors = {};

    // Validate name (required)
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate email format (optional, but must be valid if provided)
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // If there are errors, don't save
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save the lead
    onSave({
      ...formData,
      name: formData.name.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      title: formData.title.trim(),
      notes: formData.notes.trim()
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="edit-lead-modal-backdrop" onClick={onClose}>
      <div className="edit-lead-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2 className="edit-modal-title">Edit Lead</h2>
        </div>

        <div className="edit-form" onKeyDown={handleKeyPress}>
          <div className="edit-form-field">
            <label className="edit-form-label">
              Name <span className="edit-required">*</span>
            </label>
            <input
              type="text"
              className={`edit-form-input ${errors.name ? 'edit-form-input-error' : ''}`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter name"
              autoFocus
            />
            {errors.name && <span className="edit-form-error">{errors.name}</span>}
          </div>

          <div className="edit-form-field">
            <label className="edit-form-label">Company</label>
            <input
              type="text"
              className="edit-form-input"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Enter company"
            />
          </div>

          <div className="edit-form-field">
            <label className="edit-form-label">Email</label>
            <input
              type="email"
              className={`edit-form-input ${errors.email ? 'edit-form-input-error' : ''}`}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email"
            />
            {errors.email && <span className="edit-form-error">{errors.email}</span>}
          </div>

          <div className="edit-form-field">
            <label className="edit-form-label">Phone</label>
            <input
              type="tel"
              className="edit-form-input"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone"
            />
          </div>

          <div className="edit-form-field">
            <label className="edit-form-label">Title</label>
            <input
              type="text"
              className="edit-form-input"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter job title"
            />
          </div>

          <div className="edit-form-field">
            <label className="edit-form-label">Notes</label>
            <textarea
              className="edit-form-textarea"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter notes"
              rows={3}
            />
          </div>

          {lead?.sources && lead.sources.length > 0 && (
            <div className="edit-form-field">
              <label className="edit-form-label">Sources</label>
              <div className="edit-sources-list">
                {lead.sources.map((source, index) => (
                  <div key={index} className="edit-source-item">
                    <span className="edit-source-icon">
                      {source.type === 'voice' ? '🎤' : source.type === 'card' ? '📷' : '⌨️'}
                    </span>
                    <span className="edit-source-type">
                      {source.type === 'voice' ? 'Voice' : source.type === 'card' ? 'Card' : 'Text'}
                    </span>
                    <span className="edit-source-time">
                      {new Date(source.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="edit-form-actions">
          <button className="edit-save-btn" onClick={handleSave}>
            Save Changes
          </button>
          <button className="edit-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditLeadModal;
