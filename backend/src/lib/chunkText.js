/** Splits raw text into ~chunkSize character chunks on paragraph boundaries where possible. */
function chunkText(text, chunkSize = 1200) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > chunkSize && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current.trim());

  // Fallback: if text had no paragraph breaks (e.g. one giant blob), hard-split it.
  if (chunks.length === 0 && text.trim()) {
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
  }
  return chunks;
}

module.exports = { chunkText };
