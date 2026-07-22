// The line a CommonMark thematic break ("---", "***", "- - -", etc.) gets normalized to -- a
// fixed-width run of a proper horizontal-line character, since Discord doesn't render thematic
// breaks and the model's own dash count varies (as little as 3 characters, which barely reads as
// a divider).
const HORIZONTAL_RULE = '─'.repeat(24);

// splitTableRow(line) - if line contains at least one "|", splits it into trimmed fields and
// returns them; otherwise returns null. A leading/trailing "|" produces an empty first/last
// field, same as a real GFM row's outer pipes would.
function splitTableRow(line) {
  if (!line.includes('|')) {
    return null;
  }
  const fields = line.split('|').map((field) => field.trim());
  return fields.length >= 2 ? fields : null;
}

// collectTableRun(lines, start) - starting at lines[start], collects consecutive lines that each
// split into the same number of fields. Returns null unless at least 2 rows were found (a single
// pipe-containing line isn't meaningfully tabular on its own).
function collectTableRun(lines, start) {
  const first = splitTableRow(lines[start]);
  if (!first) {
    return null;
  }

  const rows = [first];
  let i = start + 1;
  while (i < lines.length) {
    const next = splitTableRow(lines[i]);
    if (!next || next.length !== first.length) {
      break;
    }
    rows.push(next);
    i++;
  }

  return rows.length >= 2 ? { rows, nextIndex: i } : null;
}

// renderTable(rows) - lays out rows as a padded, code-fenced monospace table. Discord's message
// content doesn't render markdown tables at all (no <table> support), so a fenced code block is
// the only way column alignment actually shows up visually.
function renderTable(rows) {
  const columnCount = rows[0].length;
  const widths = Array.from({ length: columnCount }, (_, col) => Math.max(...rows.map((row) => row[col].length)));
  const renderRow = (row) => row.map((cell, col) => cell.padEnd(widths[col])).join(' | ');

  return [
    '```',
    renderRow(rows[0]),
    widths.map((w) => '-'.repeat(w)).join('-|-'),
    ...rows.slice(1).map(renderRow),
    '```',
  ];
}

// formatPipeTables(text) - finds runs of 2+ consecutive lines that look like "|"-delimited table
// rows (with or without bracketing pipes, and with or without a GFM separator row -- both already
// normalized/stripped by the steps above) and rewrites them as a rendered table via renderTable().
// Skips content already inside a fenced code block, in case the model wrapped a table in one
// itself, so this doesn't produce nested/broken fences.
function formatPipeTables(text) {
  const lines = text.split('\n');
  const output = [];
  let inFence = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      output.push(line);
      i++;
      continue;
    }

    const run = !inFence && collectTableRun(lines, i);
    if (run) {
      output.push(...renderTable(run.rows));
      i = run.nextIndex;
      continue;
    }

    output.push(line);
    i++;
  }

  return output.join('\n');
}

// sanitizeMarkdownForDiscord(text) - cleans up markdown/HTML that Discord's message renderer
// doesn't support but an LLM (trained mostly on GitHub/web markdown) tends to write anyway,
// system-prompt instructions notwithstanding -- this is the deterministic backstop for whatever
// slips through despite being told not to. Targets what's actually been observed in !chat output:
// raw HTML tags (<br>, table tags), GFM table separator rows, pipe-delimited pseudo-tables, and
// LaTeX-style math notation.
module.exports = function sanitizeMarkdownForDiscord(text) {
  let result = text;

  // <br> becomes a real line break; other structural/table/list tags are just noise once
  // their content is already plain text, so drop the tags and keep the content.
  result = result.replace(/<br\s*\/?>/gi, '\n');
  result = result.replace(/<\/?(?:table|thead|tbody|tr|td|th|ul|ol|li|p|div|span)(?:\s[^>]*)?>/gi, '');

  // GFM table separator rows (e.g. "|---|:--:|---|") carry no information once tables don't
  // render as tables anyway; drop them outright, including the row's own newline so it doesn't
  // leave a blank line behind.
  result = result.replace(/^[ \t]*\|?[ \t:-]+\|[ \t:|-]*(?:\r?\n|$)/gm, '');
  // Remaining table rows keep their cells but lose the bracketing pipes -- not a real table,
  // but plainer text than "| a | b | c |".
  result = result.replace(/^([ \t]*)\|(.+)\|[ \t]*$/gm, (_match, indent, inner) => indent + inner.trim());

  // A CommonMark "thematic break" (3+ of the same -, _, or * character, optionally spaced out,
  // alone on its own line) doesn't render as a horizontal rule in Discord either -- it just shows
  // up as a stray "---". Normalize it to a fixed-width line of a proper horizontal-line character
  // instead, which reads clearly as a divider regardless of how short/sparse the model wrote it.
  result = result.replace(/^[ \t]*([-_*])(?:[ \t]*\1){2,}[ \t]*$/gm, HORIZONTAL_RULE);

  // LaTeX-style math notation: handle the operators/wrappers actually seen, then a generic
  // fallback for any other \command{...} or bare \command that slips through.
  const latexReplacements = [
    [/\\times/g, 'x'],
    [/\\cdot/g, '*'],
    [/\\div/g, '/'],
    [/\\pm/g, '±'],
    [/\\approx/g, '≈'],
    [/\\text\{([^}]*)\}/g, '$1'],
    [/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2'],
    [/\\[()[\]]/g, ''],
    // LaTeX spacing commands (\, \; \: \! and escaped space) are punctuation, not letters, so
    // they'd otherwise slip past the letter-only catch-all below.
    [/\\[,;: !]/g, ' '],
  ];
  for (const [pattern, replacement] of latexReplacements) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');
  result = result.replace(/\\[a-zA-Z]+/g, '');

  // Wrap bare URLs in <angle brackets> so Discord doesn't generate a link preview/embed for
  // them -- still a clickable link, just without the extra embed card. Skips URLs already
  // wrapped (the negative lookbehind), so this is safe to run whether or not the model already
  // did it itself. Trailing sentence punctuation (periods, closing parens, etc.) is excluded
  // from the bracket so it reads naturally, e.g. "...home)." not "...home).>".
  result = result.replace(/(?<!<)(https?:\/\/[^\s<>]+)/g, (url) => {
    const trailingPunctuation = url.match(/[.,!?;:)\]]+$/);
    if (!trailingPunctuation) {
      return `<${url}>`;
    }
    const core = url.slice(0, -trailingPunctuation[0].length);
    return `<${core}>${trailingPunctuation[0]}`;
  });

  // Collapse the ragged whitespace/blank lines left behind by the replacements above: multiple
  // internal spaces (e.g. from a removed LaTeX command) become one, but leading indentation is
  // preserved since it can be meaningful (nested list items).
  result = result
    .split('\n')
    .map((line) => {
      const leading = line.match(/^[ \t]*/)[0];
      const rest = line
        .slice(leading.length)
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/[ \t]+$/, '');
      return leading + rest;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Runs last so the column padding it adds survives the whitespace-collapsing step above.
  result = formatPipeTables(result);

  return result;
};
