const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const chunkLines = require('../src/utils/chunkMessage.js');

describe('chunkMessage', () => {
  it('joins short lines into a single chunk', () => {
    const result = chunkLines(['one', 'two', 'three']);
    assert.deepEqual(result, ['one\ntwo\nthree']);
  });

  it('splits into multiple chunks once the limit is exceeded', () => {
    const lines = ['a'.repeat(10), 'b'.repeat(10), 'c'.repeat(10)];
    const result = chunkLines(lines, 15);

    assert.equal(result.length, 3);
    for (const chunk of result) {
      assert.ok(chunk.length <= 15);
    }
    assert.equal(result.join('\n'), lines.join('\n'));
  });

  it('keeps a fenced code block intact when it would otherwise be split across chunks', () => {
    const lines = ['intro text here', '```', 'row one', 'row two', '```', 'outro text here'];
    // Limit chosen so "intro text here" + the whole fenced block would overflow together, but
    // each piece individually fits.
    const result = chunkLines(lines, 30);

    assert.equal(result.length, 3);
    assert.equal(result[0], 'intro text here');
    assert.equal(result[1], '```\nrow one\nrow two\n```');
    assert.equal(result[2], 'outro text here');

    // The fenced block must never be split mid-block across chunk boundaries.
    for (const chunk of result) {
      const fenceCount = (chunk.match(/```/g) || []).length;
      assert.equal(fenceCount % 2, 0, `chunk has an unterminated fence: ${JSON.stringify(chunk)}`);
    }
  });

  it('keeps a fenced code block together with preceding content when both fit in one chunk', () => {
    const lines = ['intro', '```', 'row', '```'];
    const result = chunkLines(lines, 2000);

    assert.deepEqual(result, ['intro\n```\nrow\n```']);
  });

  it('flushes an unterminated fence rather than losing its content', () => {
    const lines = ['before', '```', 'unclosed row'];
    const result = chunkLines(lines, 2000);

    assert.deepEqual(result, ['before\n```\nunclosed row']);
  });

  it('reconstructs the original content exactly when nothing needs to be split', () => {
    const lines = ['a', '```', 'b', 'c', '```', 'd'];
    assert.equal(chunkLines(lines).join('\n'), lines.join('\n'));
  });
});
