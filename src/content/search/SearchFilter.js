/**
 * Search Filter Module
 * Pure function for filtering notes based on search term
 */

/**
 * Filter notes based on search term
 * @param {string} searchTerm - Search term
 * @param {Array} notes - Array of notes to filter
 * @returns {Array} Filtered notes
 */
export function filterNotes(searchTerm, notes) {
  if (!searchTerm || !notes) return notes;

  const term = searchTerm.trim().toLowerCase();
  if (!term) return notes;

  return notes.filter((note) => {
    const searchIn = [
      note.content || "",
      note.author || "",
      note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "",
      note.createdAt ? new Date(note.createdAt).toLocaleTimeString() : "",
    ]
      .join(" ")
      .toLowerCase();

    return searchIn.includes(term);
  });
}
