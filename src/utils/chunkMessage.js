const DISCORD_MESSAGE_LIMIT = 2000;

// join lines with '\n', splitting into multiple chunks so none exceeds Discord's message limit
module.exports = function chunkLines(lines, limit = DISCORD_MESSAGE_LIMIT - 20) {
  const chunks = [];
  let current = '';
  for (const line of lines) {
    if (current.length + line.length + 1 > limit) {
      chunks.push(current);
      current = '';
    }
    current += (current ? '\n' : '') + line;
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
};
