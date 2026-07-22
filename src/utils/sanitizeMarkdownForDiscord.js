// The line a CommonMark thematic break ("---", "***", "- - -", etc.) gets normalized to -- a
// fixed-width run of a proper horizontal-line character, since Discord doesn't render thematic
// breaks and the model's own dash count varies (as little as 3 characters, which barely reads as
// a divider).
const HORIZONTAL_RULE = '─'.repeat(24);

// sanitizeMarkdownForDiscord(text) - cleans up markdown/HTML that Discord's message renderer
// doesn't support but an LLM (trained mostly on GitHub/web markdown) tends to write anyway,
// system-prompt instructions notwithstanding -- this is the deterministic backstop for whatever
// slips through despite being told not to. Targets what's actually been observed in !chat output:
// raw HTML tags (<br>, table tags), thematic breaks, and LaTeX-style math notation. Does NOT
// touch "|"-delimited table content -- that's handled separately by parseTableSegments.js, which
// needs to see the raw pipes/separator rows intact to tell a real table from plain text.
module.exports = function sanitizeMarkdownForDiscord(text) {
  let result = text;

  // <br> becomes a real line break; other structural/table/list tags are just noise once
  // their content is already plain text, so drop the tags and keep the content.
  result = result.replace(/<br\s*\/?>/gi, '\n');
  result = result.replace(/<\/?(?:table|thead|tbody|tr|td|th|ul|ol|li|p|div|span)(?:\s[^>]*)?>/gi, '');

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

  return result;
};
