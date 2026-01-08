import * as XLSX from 'xlsx';

/**
 * Export leads to CSV
 * @param {Array} leads - Array of lead objects
 * @returns {void} - Triggers download
 */
export function exportToCSV(leads) {
  const headers = ['Name', 'Company', 'Email', 'Phone', 'Title', 'Notes', 'Captured At'];
  
  const rows = leads.map(lead => [
    lead.name || '',
    lead.company || '',
    lead.email || '',
    lead.phone || '',
    lead.title || '',
    lead.notes || '',
    lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''
  ]);

  // Escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `leadbruh-${getDateString()}.csv`);
}

/**
 * Export leads to Excel (.xlsx)
 * @param {Array} leads - Array of lead objects
 * @returns {void} - Triggers download
 */
export function exportToExcel(leads) {
  const headers = ['Name', 'Company', 'Email', 'Phone', 'Title', 'Notes', 'Captured At'];
  
  const rows = leads.map(lead => [
    lead.name || '',
    lead.company || '',
    lead.email || '',
    lead.phone || '',
    lead.title || '',
    lead.notes || '',
    lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''
  ]);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Name
    { wch: 25 }, // Company
    { wch: 30 }, // Email
    { wch: 15 }, // Phone
    { wch: 20 }, // Title
    { wch: 40 }, // Notes
    { wch: 20 }, // Captured At
  ];

  // Style header row (bold)
  const headerRange = XLSX.utils.decode_range(ws['!ref']);
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');

  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `leadbruh-${getDateString()}.xlsx`);
}

/**
 * Export leads to JSON (for backup/transfer)
 * @param {Array} leads - Array of lead objects
 * @returns {void} - Triggers download
 */
export function exportToJSON(leads) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    count: leads.length,
    leads: leads
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `leadbruh-${getDateString()}.json`);
}

/**
 * Import leads from JSON backup
 * @param {File} file - JSON file
 * @returns {Promise<Array>} - Array of lead objects
 */
export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.leads || !Array.isArray(data.leads)) {
          throw new Error('Invalid backup file format');
        }
        
        resolve(data.leads);
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Helper: Get date string for filename
function getDateString() {
  return new Date().toISOString().split('T')[0];
}

// Helper: Trigger file download
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
