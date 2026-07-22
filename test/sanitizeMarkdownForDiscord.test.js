const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const sanitizeMarkdownForDiscord = require('../src/utils/sanitizeMarkdownForDiscord.js');

describe('sanitizeMarkdownForDiscord', () => {
  it('converts <br> tags to real line breaks', () => {
    const result = sanitizeMarkdownForDiscord('line one<br>line two<br/>line three<br />line four');
    assert.equal(result, 'line one\nline two\nline three\nline four');
  });

  it('strips table/list/structural HTML tags but keeps their content', () => {
    const result = sanitizeMarkdownForDiscord('<table><tr><td>Honey</td><td>3.2lb</td></tr></table>');
    assert.equal(result, 'Honey3.2lb');
  });

  it('reformats a GFM table (separator row and all) into a padded, code-fenced table', () => {
    const result = sanitizeMarkdownForDiscord('| Ingredient | Amount |\n|---|---|\n| Honey | 3.2lb |');
    assert.equal(result, '```\n' + 'Ingredient | Amount\n' + '-----------|-------\n' + 'Honey      | 3.2lb \n' + '```');
  });

  it('leaves a single (non-tabular) pipe-delimited line alone instead of wrapping it', () => {
    const result = sanitizeMarkdownForDiscord('| Honey | 3.2lb | Notes here |');
    assert.equal(result, 'Honey | 3.2lb | Notes here');
  });

  it('reformats a run of 2+ unbracketed pipe-delimited rows into a padded, code-fenced table', () => {
    const input =
      'Addition | Timing | Fermaid O | Fermaid K | DAP\n' +
      '1 | 24h after pitch | 0.62 g | 0.74 g | 0\n' +
      '2 | 48h after pitch | 0.62 g | 0.74 g | 0';

    const result = sanitizeMarkdownForDiscord(input);
    const lines = result.split('\n');

    assert.equal(lines[0], '```');
    assert.equal(lines[lines.length - 1], '```');
    assert.equal(lines.length, 6); // ``` + header + divider + 2 data rows + ```
    assert.match(lines[2], /^-+\|-+\|-+\|-+\|-+$/);

    // every non-fence, non-divider line should be the same length (columns actually align)
    const contentLines = lines.slice(1, -1).filter((line) => !/^-+(\|-+)*$/.test(line));
    assert.equal(new Set(contentLines.map((line) => line.length)).size, 1);

    assert.ok(lines[1].includes('Addition') && lines[1].includes('DAP'));
    assert.ok(lines[3].includes('1') && lines[3].includes('24h after pitch'));
    assert.ok(lines[4].includes('2') && lines[4].includes('48h after pitch'));
  });

  it('does not wrap a single pipe-containing line with no matching neighbor', () => {
    const result = sanitizeMarkdownForDiscord('Honey has ~80% sugar content, roughly.');
    assert.equal(result, 'Honey has ~80% sugar content, roughly.');
  });

  it('does not reformat a table the model already wrapped in its own code fence', () => {
    const input = '```\nA | B\nC | D\n```';
    assert.equal(sanitizeMarkdownForDiscord(input), input);
  });

  it('converts common LaTeX operators to plain-text equivalents', () => {
    const result = sanitizeMarkdownForDiscord('OG \\times 131.25, a \\cdot b, a \\div b, 12 \\pm 1, \\approx 12');
    assert.equal(result, 'OG x 131.25, a * b, a / b, 12 ± 1, ≈ 12');
  });

  it('unwraps \\text{...} to its plain content', () => {
    const result = sanitizeMarkdownForDiscord('\\text{ABV} = (OG - FG) \\times 131.25');
    assert.equal(result, 'ABV = (OG - FG) x 131.25');
  });

  it('converts \\frac{a}{b} to a/b', () => {
    const result = sanitizeMarkdownForDiscord('\\frac{OG - FG}{0.00736}');
    assert.equal(result, 'OG - FG/0.00736');
  });

  it('strips LaTeX math delimiters', () => {
    const result = sanitizeMarkdownForDiscord('\\(ABV\\) and \\[OG\\]');
    assert.equal(result, 'ABV and OG');
  });

  it('unwraps an unrecognized \\command{arg} to its argument', () => {
    const result = sanitizeMarkdownForDiscord('\\mathrm{ABV} is the target');
    assert.equal(result, 'ABV is the target');
  });

  it('drops a bare \\command with no braces, collapsing the whitespace it leaves behind', () => {
    const result = sanitizeMarkdownForDiscord('a \\quad b \\, c');
    assert.equal(result, 'a b c');
  });

  it('collapses runs of 3+ blank lines and trims leading/trailing whitespace', () => {
    const result = sanitizeMarkdownForDiscord('\n\n  first\n\n\n\nsecond  \n\n\n');
    assert.equal(result, 'first\n\nsecond');
  });

  it('leaves ordinary Discord-safe markdown untouched', () => {
    const text = '**Recipe**\n- Honey: 3.2 lb\n- Water: to 1 gal\n\nEnjoy!';
    assert.equal(sanitizeMarkdownForDiscord(text), text);
  });

  it('wraps a bare URL in angle brackets to suppress Discord link previews', () => {
    const result = sanitizeMarkdownForDiscord('See https://wiki.meadtools.com/en/home for details');
    assert.equal(result, 'See <https://wiki.meadtools.com/en/home> for details');
  });

  it('excludes trailing sentence punctuation from the bracketed URL', () => {
    const result = sanitizeMarkdownForDiscord('Check https://wiki.meadtools.com/en/home.');
    assert.equal(result, 'Check <https://wiki.meadtools.com/en/home>.');
  });

  it('excludes a wrapping closing parenthesis from the bracketed URL', () => {
    const result = sanitizeMarkdownForDiscord(
      'Nutrient schedule (https://wiki.meadtools.com/en/process/nutrient_schedules) covers this.'
    );
    assert.equal(result, 'Nutrient schedule (<https://wiki.meadtools.com/en/process/nutrient_schedules>) covers this.');
  });

  it('leaves an already-bracketed URL alone instead of double-wrapping it', () => {
    const text = 'See <https://wiki.meadtools.com/en/home> for details';
    assert.equal(sanitizeMarkdownForDiscord(text), text);
  });

  it('wraps multiple distinct URLs in the same reply independently', () => {
    const result = sanitizeMarkdownForDiscord(
      'Process Summary: https://wiki.meadtools.com/en/process/process_summary\n' +
        'Nutrient Schedules: https://wiki.meadtools.com/en/process/nutrient_schedules'
    );
    assert.equal(
      result,
      'Process Summary: <https://wiki.meadtools.com/en/process/process_summary>\n' +
        'Nutrient Schedules: <https://wiki.meadtools.com/en/process/nutrient_schedules>'
    );
  });

  it('cleans up a realistic mixed example', () => {
    const input =
      '**Recipe**\n\n' +
      '| Ingredient | Amount | Notes |\n' +
      '|---|---|---|\n' +
      '| Honey | 3.2lb | Gives OG \\approx 1.100<br>Adjust to taste |\n\n' +
      '\\text{ABV} = (OG - FG) \\times 131.25 ' +
      '(https://wiki.meadtools.com/en/process/process_summary).';

    const result = sanitizeMarkdownForDiscord(input);

    assert.ok(!result.includes('<br>'));
    assert.ok(!result.includes('---'));
    assert.ok(!result.includes('\\text'));
    assert.ok(!result.includes('\\times'));
    assert.ok(!result.includes('\\approx'));
    assert.ok(result.includes('ABV = (OG - FG) x 131.25'));
    assert.ok(result.includes('Adjust to taste'));
    assert.ok(result.includes('(<https://wiki.meadtools.com/en/process/process_summary>).'));
  });
});
