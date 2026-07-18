const { readVersion } = require('../version.js');

const DEFAULT_INTERVAL_MS = 4000;

// Periodically re-reads version.json and compares it to the version loaded at startup
// (client.version). A deploy is expected to overwrite version.json with a new value;
// once noticed, this process exits so the systemd service can restart it onto the new code.
// Exits with a non-zero code so the restart also happens under a conservative
// Restart=on-failure policy, not just Restart=always.
function startVersionWatcher(client, intervalMs = DEFAULT_INTERVAL_MS) {
  return setInterval(() => {
    let currentVersion;
    try {
      currentVersion = readVersion();
    } catch (e) {
      console.error('Failed to read version file:', e);
      return;
    }

    if (currentVersion !== client.version) {
      console.log(`Version changed from ${client.version} to ${currentVersion}; exiting so the service can restart.`);
      process.exit(1);
    }
  }, intervalMs);
}

module.exports = { startVersionWatcher, DEFAULT_INTERVAL_MS };
