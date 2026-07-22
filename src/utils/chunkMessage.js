const DISCORD_MESSAGE_LIMIT = 2000;

// join lines with '\n', splitting into multiple chunks so none exceeds Discord's message limit.
// Fenced code blocks (```...```, e.g. a table sanitizeMarkdownForDiscord.js generated) are kept
// intact -- if adding one would overflow the current chunk, the whole block moves to a fresh
// chunk instead of splitting across the boundary and breaking its formatting/content.
module.exports = function chunkLines(lines, limit = DISCORD_MESSAGE_LIMIT - 20) {
  const chunks = [];
  let current = '';

  function addPiece(text) {
    if (current.length + text.length + 1 > limit) {
      chunks.push(current);
      current = '';
    }
    current += (current ? '\n' : '') + text;
  }

  let block = null; // lines of an in-progress fenced code block, including its opening ```
  for (const line of lines) {
    if (block) {
      block.push(line);
      if (line.trim().startsWith('```')) {
        addPiece(block.join('\n'));
        block = null;
      }
      continue;
    }

    if (line.trim().startsWith('```')) {
      block = [line];
      continue;
    }

    addPiece(line);
  }
  if (block) {
    // Unterminated fence (shouldn't happen from sanitizeMarkdownForDiscord's own output, but
    // defends against a model reply that never closes one) -- flush what was collected as-is.
    addPiece(block.join('\n'));
  }

  if (current) {
    chunks.push(current);
  }
  return chunks;
};
