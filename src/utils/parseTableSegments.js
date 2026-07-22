// splitRow(line) - if line contains at least one "|", splits it into trimmed cell values --
// stripping a single bracketing leading/trailing "|" first (if present), so "| a | b |" and
// "a | b" both split into the same two cells rather than the bracketed form getting spurious
// empty cells at each end; otherwise returns null.
function splitRow(line) {
  if (!line.includes('|')) {
    return null;
  }
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const fields = inner.split('|').map((field) => field.trim());
  return fields.length >= 2 ? fields : null;
}

// isSeparatorRow(line) - true for a GFM table separator row (e.g. "|---|:--:|---|", or the same
// without bracketing pipes) -- a line made up of only pipes/dashes/colons/whitespace, with a
// required pipe (a genuine 2+-column separator always has one; a pipe-less dash run is a
// thematic break instead, already normalized away by sanitizeMarkdownForDiscord before this
// runs). Used to confirm the line before it was really a header, not just another data row that
// happens to have the same column count.
function isSeparatorRow(line) {
  return /^[ \t]*\|?[ \t:-]+\|[ \t:|-]*$/.test(line);
}

// unbracketRow(line) - strips a single row's bracketing pipes ("| a | b |" -> "a | b"), same as
// a real GFM row would lose once tables don't render as tables anyway. Used for a lone
// pipe-delimited line that didn't turn out to be part of a table.
function unbracketRow(line) {
  const match = line.match(/^([ \t]*)\|(.+)\|[ \t]*$/);
  return match ? match[1] + match[2].trim() : line;
}

// collectTableBlock(lines, start) - starting at lines[start], tries to collect a table:
//  - if the next line is a real GFM separator row, lines[start] is a confirmed header and
//    whatever same-column-count lines follow the separator are data rows (1+ required).
//  - otherwise, collects consecutive same-column-count lines as an unheaded block (2+ required
//    total, since a single pipe-containing line isn't meaningfully tabular on its own).
// Returns null if neither shape matched.
function collectTableBlock(lines, start) {
  const first = splitRow(lines[start]);
  if (!first) {
    return null;
  }

  let i = start + 1;
  let hasHeader = false;
  if (i < lines.length && isSeparatorRow(lines[i])) {
    hasHeader = true;
    i++;
  }

  const columnCount = first.length;
  const rows = [];
  while (i < lines.length) {
    const next = splitRow(lines[i]);
    if (!next || next.length !== columnCount) {
      break;
    }
    rows.push(next);
    i++;
  }

  if (hasHeader) {
    return rows.length >= 1 ? { hasHeader: true, header: first, rows, nextIndex: i } : null;
  }
  return rows.length >= 1 ? { hasHeader: false, header: null, rows: [first, ...rows], nextIndex: i } : null;
}

// toTableSegment(block) - decides how a collected block should be laid out: a confirmed header
// (a real separator row was present) always lays out one column per field, since the header row
// names what each column of data means. Without that confirmation, an exactly-2-column block is
// treated as a flat list of independent key/value facts instead (e.g. "Target volume | 1.18 gal"
// next to "Target ABV | 12.3%" aren't a shared "column" of anything) -- one field per row. 3+
// unconfirmed columns still get the one-field-per-column layout, since a wide block of pipe-rows
// with no header is overwhelmingly a table the model just didn't bother to add "---" to.
function toTableSegment(block) {
  if (!block.hasHeader && block.rows[0].length === 2) {
    return { type: 'table', mode: 'keyValue', pairs: block.rows };
  }
  const header = block.hasHeader ? block.header : block.rows[0];
  const dataRows = block.hasHeader ? block.rows : block.rows.slice(1);
  return { type: 'table', mode: 'columns', header, dataRows };
}

// parseTableSegments(text) - splits already-sanitized text (see sanitizeMarkdownForDiscord.js)
// into an ordered list of segments -- { type: 'text', text } for ordinary content, and the
// table-shaped segments toTableSegment() produces for "|"-delimited blocks. Skips content already
// inside a fenced code block, in case the model wrapped something in one itself, so this doesn't
// misinterpret it. A lone pipe-delimited line that doesn't form a table is folded into the
// surrounding text with its bracketing pipes stripped, same as a real GFM row would lose them.
module.exports = function parseTableSegments(text) {
  const lines = text.split('\n');
  const segments = [];
  let textBuffer = [];
  let inFence = false;
  let i = 0;

  function flushText() {
    if (textBuffer.length > 0) {
      segments.push({ type: 'text', text: textBuffer.join('\n') });
      textBuffer = [];
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      textBuffer.push(line);
      i++;
      continue;
    }

    const block = !inFence && collectTableBlock(lines, i);
    if (block) {
      flushText();
      segments.push(toTableSegment(block));
      i = block.nextIndex;
      continue;
    }

    textBuffer.push(unbracketRow(line));
    i++;
  }

  flushText();
  return segments;
};
