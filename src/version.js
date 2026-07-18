const fs = require('fs');
const path = require('path');

const VERSION_FILE_PATH = path.join(__dirname, '..', 'version.json');

function readVersion() {
  const contents = fs.readFileSync(VERSION_FILE_PATH, 'utf8');
  return JSON.parse(contents).version;
}

module.exports = { readVersion, VERSION_FILE_PATH };
