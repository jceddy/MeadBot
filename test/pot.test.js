const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const pot = require('../src/commands/pot.js');

function run(args) {
  let captured = null;
  const message = {
    channel: {
      send: (payload) => {
        captured = payload;
      },
    },
  };
  pot.execute(message, args);
  return captured.embeds[0].data;
}

function fields(embed) {
  return {
    gravity: embed.fields[0].value,
    abv: embed.fields[1].value,
  };
}

describe('!potential-alcohol default-value quirk', () => {
  it('solves abv (not og) when og is explicitly given but happens to equal the default', () => {
    // og=1.108 is also this command's default og — before the fix, this was misdetected as
    // "og not specified", silently overwriting the user's stated og with a value solved from
    // the default abv instead of solving abv from the user's og+fg as it should.
    const { gravity, abv } = fields(run(['-o', '1.108', '-f', '0.990']));
    assert.match(gravity, /Original Gravity: 1\.108/);
    assert.match(gravity, /Final Gravity: 0\.990/);
    assert.equal(abv, '15.320');
  });

  it('solves fg (not abv) when abv is explicitly given but happens to equal the default', () => {
    // abv=14.37 is also this command's default abv — before the fix, this was misdetected as
    // "abv not specified", silently discarding the user's stated abv.
    const { gravity, abv } = fields(run(['-o', '1.100', '-a', '14.37']));
    assert.match(gravity, /Original Gravity: 1\.100/);
    assert.match(gravity, /Final Gravity: 0\.990/);
    assert.equal(abv, '14.370');
  });

  it('still solves abv from an og that merely happens to equal the default, alone', () => {
    const { abv } = fields(run(['-o', '1.108']));
    assert.equal(abv, '14.381');
  });

  it('leaves non-default-colliding behavior unchanged', () => {
    const { gravity, abv } = fields(run(['-o', '1.100', '-f', '0.995']));
    assert.match(gravity, /Original Gravity: 1\.100/);
    assert.match(gravity, /Final Gravity: 0\.995/);
    assert.equal(abv, '13.787');
  });
});
