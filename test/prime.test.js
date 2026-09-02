const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const prime = require('../src/commands/prime.js');

function run(args) {
  let captured = null;
  const message = {
    channel: {
      send: (payload) => {
        captured = payload;
      },
    },
  };
  prime.execute(message, args);
  return captured;
}

describe('!prime', () => {
  it('reports priming sugar grams/ounces using its defaults when no args are given', () => {
    const embed = run([]).embeds[0].data;
    assert.match(embed.fields[0].value, /5 Gallon\(s\) US at 68°F/);
    assert.match(embed.fields[2].value, /116\.9 g \(4\.12 oz\)/);
  });

  it('applies -v/-u/-t/-f/-c/-s flags', () => {
    const embed = run(['-v', '5', '-u', 'gallons_us', '-t', '20', '-f', 'c', '-c', '2.4', '-s', 'honey']).embeds[0].data;
    assert.equal(embed.fields[2].name, 'Honey');
  });

  it('sends the plain error message (not an embed) on invalid input', () => {
    const result = run(['-v', 'a lot']);
    assert.equal(typeof result, 'string');
    assert.match(result, /is not a number/);
  });

  it('prints usage/help text for -h', () => {
    const result = run(['-h']);
    assert.match(result, /^Usage: !prime/);
  });
});
