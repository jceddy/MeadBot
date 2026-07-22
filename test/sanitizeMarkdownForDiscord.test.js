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

  it("leaves pipe-delimited content untouched -- table detection is parseTableSegments.js's job", () => {
    const text = 'Addition | Timing | Fermaid O\n1 | 24h after pitch | 0.62 g\n2 | 48h after pitch | 0.62 g';
    assert.equal(sanitizeMarkdownForDiscord(text), text);
  });

  it('normalizes a bare "---" thematic break into a proper horizontal-line divider', () => {
    const result = sanitizeMarkdownForDiscord('Before\n---\nAfter');
    const lines = result.split('\n');

    assert.equal(lines.length, 3);
    assert.equal(lines[0], 'Before');
    assert.equal(lines[2], 'After');
    assert.ok(!lines[1].includes('-'));
    assert.match(lines[1], /^─{10,}$/);
  });

  it('normalizes *** and spaced-out - - - thematic breaks the same way', () => {
    const asterisks = sanitizeMarkdownForDiscord('a\n***\nb').split('\n')[1];
    const spaced = sanitizeMarkdownForDiscord('a\n- - - -\nb').split('\n')[1];

    assert.match(asterisks, /^─{10,}$/);
    assert.match(spaced, /^─{10,}$/);
    assert.equal(asterisks, spaced);
  });

  it('does not touch a bullet list, a short "--", or an inline "--" used as a dash', () => {
    const bullets = '- Honey: 3.2 lb\n- Water: to 1 gal';
    assert.equal(sanitizeMarkdownForDiscord(bullets), bullets);
    assert.equal(sanitizeMarkdownForDiscord('--'), '--');
    assert.equal(sanitizeMarkdownForDiscord('wait--what'), 'wait--what');
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
      'Gives OG \\approx 1.100<br>Adjust to taste.\n\n' +
      '\\text{ABV} = (OG - FG) \\times 131.25 ' +
      '(https://wiki.meadtools.com/en/process/process_summary).';

    const result = sanitizeMarkdownForDiscord(input);

    assert.ok(!result.includes('<br>'));
    assert.ok(!result.includes('\\text'));
    assert.ok(!result.includes('\\times'));
    assert.ok(!result.includes('\\approx'));
    assert.ok(result.includes('ABV = (OG - FG) x 131.25'));
    assert.ok(result.includes('Adjust to taste'));
    assert.ok(result.includes('(<https://wiki.meadtools.com/en/process/process_summary>).'));
  });
});
