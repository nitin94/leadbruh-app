/**
 * Merges new lead data into an existing lead
 * - Preserves existing non-empty fields
 * - Appends notes with separator
 * - Takes max confidence score
 * - Concatenates sources array
 */
export function mergeLead(existingLead, newData) {
  return {
    ...existingLead,
    // Keep existing values if present, only fill empty fields
    name: existingLead.name || newData.name,
    company: existingLead.company || newData.company,
    email: existingLead.email || newData.email,
    phone: existingLead.phone || newData.phone,

    // Update title if new one is more specific (longer)
    title: (newData.title?.length || 0) > (existingLead.title?.length || 0)
      ? newData.title
      : existingLead.title,

    // Append notes with separator
    notes: [existingLead.notes, newData.notes]
      .filter(Boolean)
      .join(' | '),

    // Take maximum confidence score
    confidence: Math.max(
      existingLead.confidence || 0,
      newData.confidence || 0
    ),

    // Concatenate sources arrays, preserving chronological order
    sources: [
      ...(existingLead.sources || []),
      ...(newData.sources || [])
    ],

    // Update timestamp
    updatedAt: new Date().toISOString()
  };
}
