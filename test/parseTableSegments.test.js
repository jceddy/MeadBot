const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const parseTableSegments = require('../src/utils/parseTableSegments.js');

describe('parseTableSegments', () => {
  it('returns a single text segment for content with no pipes at all', () => {
    const text = '**Recipe**\n- Honey: 3.2 lb\n- Water: to 1 gal\n\nEnjoy!';
    assert.deepEqual(parseTableSegments(text), [{ type: 'text', text }]);
  });

  it('treats an unheaded 2-column block as independent key/value pairs', () => {
    const text = '**Target volume** | **1.18 gal**\n**Target OG** | **1.110**\n**Target ABV** | **12.3%**';
    const segments = parseTableSegments(text);

    assert.equal(segments.length, 1);
    assert.equal(segments[0].type, 'table');
    assert.equal(segments[0].mode, 'keyValue');
    assert.deepEqual(segments[0].pairs, [
      ['**Target volume**', '**1.18 gal**'],
      ['**Target OG**', '**1.110**'],
      ['**Target ABV**', '**12.3%**'],
    ]);
  });

  it('treats an unheaded 3+-column block as a header row plus data rows', () => {
    const text = 'Addition | Timing | Fermaid O\n1 | 24h after pitch | 0.62 g\n2 | 48h after pitch | 0.62 g';
    const segments = parseTableSegments(text);

    assert.equal(segments.length, 1);
    assert.equal(segments[0].type, 'table');
    assert.equal(segments[0].mode, 'columns');
    assert.deepEqual(segments[0].header, ['Addition', 'Timing', 'Fermaid O']);
    assert.deepEqual(segments[0].dataRows, [
      ['1', '24h after pitch', '0.62 g'],
      ['2', '48h after pitch', '0.62 g'],
    ]);
  });

  it('treats a real GFM 2-column table (confirmed by its separator row) as columns, not key/value', () => {
    const text = '| Ingredient | Amount |\n|---|---|\n| Honey | 3.2lb |\n| Water | 1 gal |';
    const segments = parseTableSegments(text);

    assert.equal(segments.length, 1);
    assert.equal(segments[0].mode, 'columns');
    assert.deepEqual(segments[0].header, ['Ingredient', 'Amount']);
    assert.deepEqual(segments[0].dataRows, [
      ['Honey', '3.2lb'],
      ['Water', '1 gal'],
    ]);
  });

  it('recognizes an unbracketed GFM separator row too', () => {
    const text = 'Ingredient | Amount\n---|---\nHoney | 3.2lb\nWater | 1 gal';
    const segments = parseTableSegments(text);

    assert.equal(segments[0].mode, 'columns');
    assert.deepEqual(segments[0].header, ['Ingredient', 'Amount']);
  });

  it('un-brackets a lone pipe-delimited line that does not form a table', () => {
    assert.deepEqual(parseTableSegments('| Honey | 3.2lb | Notes here |'), [
      { type: 'text', text: 'Honey | 3.2lb | Notes here' },
    ]);
  });

  it('leaves a header line with no separator and no matching data row alone as text', () => {
    // Only one line has a pipe -- not enough to be a table on its own, header-shaped or not.
    assert.deepEqual(parseTableSegments('Addition | Timing | Fermaid O'), [
      { type: 'text', text: 'Addition | Timing | Fermaid O' },
    ]);
  });

  it('interleaves text and table segments in order', () => {
    const text = 'Intro line.\n\nAddition | Timing\n1 | 24h\n2 | 48h\n\nOutro line.';
    const segments = parseTableSegments(text);

    assert.equal(segments.length, 3);
    assert.equal(segments[0].type, 'text');
    assert.equal(segments[0].text, 'Intro line.\n');
    assert.equal(segments[1].type, 'table');
    assert.equal(segments[2].type, 'text');
    assert.equal(segments[2].text, '\nOutro line.');
  });

  it('does not treat pipe-delimited content already inside a fenced code block as a table', () => {
    const text = '```\nA | B\nC | D\n```';
    assert.deepEqual(parseTableSegments(text), [{ type: 'text', text }]);
  });

  it('detects a table that comes after a fenced code block has already closed', () => {
    const text = '```\ncode here\n```\n\nA | B\nC | D';
    const segments = parseTableSegments(text);

    assert.equal(segments.length, 2);
    assert.equal(segments[0].type, 'text');
    assert.ok(segments[0].text.includes('```'));
    assert.equal(segments[1].type, 'table');
  });
});
