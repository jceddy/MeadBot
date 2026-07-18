const path = require('path');

module.exports = function mediaPath(filename) {
  return path.join(__dirname, '..', '..', 'media', filename);
};
