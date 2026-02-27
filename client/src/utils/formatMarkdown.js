/**
 * Post-process AI response to ensure proper markdown formatting
 * @param {string} text - The AI response text
 * @returns {string} - Properly formatted markdown text
 */
export const formatMarkdown = (text) => {
  if (!text) return '';

  let formatted = text;

  // Fix broken bold syntax: "** text**" -> "**text**"
  formatted = formatted.replace(/\*\*\s+/g, '**');
  formatted = formatted.replace(/\s+\*\*/g, '**');

  // Fix lines starting with "**" that should be bullet points
  // Pattern: "** Text**:" at start of line -> "- **Text**:"
  formatted = formatted.replace(/^\*\*\s*([^*]+)\*\*:/gm, '- **$1**:');
  formatted = formatted.replace(/\n\*\*\s*([^*]+)\*\*:/g, '\n- **$1**:');

  // Replace bullet character "•" with markdown "- "
  formatted = formatted.replace(/•\s*/g, '- ');

  // Ensure bullet points are on separate lines
  // Match patterns like "- text - text" and split them
  formatted = formatted.replace(/([.!?])\s*-\s+/g, '$1\n\n- ');

  // Split inline bullets that aren't at the start of a line
  formatted = formatted.replace(/([^\n])\s+-\s+(?=[A-Z₹])/g, '$1\n- ');

  // Ensure numbered list items are on separate lines
  formatted = formatted.replace(/(\d+\.)\s*([^\n]+?)(?=\s+\d+\.)/g, '$1 $2\n');

  // Ensure there's a newline before bullet lists that follow text
  formatted = formatted.replace(/([.!?:])(\n?)(-\s)/g, '$1\n\n$3');

  // Clean up multiple newlines (more than 2)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  formatted = formatted.trim();

  return formatted;
};

export default formatMarkdown;
