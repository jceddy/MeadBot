# MeadBot

Discord bot for a mead-making community. See README.md for architecture, setup, and command
reference.

## Release process

Every PR opened against `main` must bump `version.json`'s `version` field (semver:
`MAJOR.MINOR.PATCH`). This is not cosmetic — `src/jobs/versionWatcher.js` polls that file at
runtime and exits the process when it changes, which is how a deploy (see
`.github/workflows/deploy.yml`) gets the running bot to restart onto new code without any
SSH/remote-exec access to the host. A PR that changes behavior without bumping the version won't
trigger a restart after deploy, silently leaving the old code running.

Pick the bump like normal semver: PATCH for fixes/tweaks, MINOR for new features/commands,
MAJOR for breaking changes. `package.json`'s version field is unrelated and not touched by this
process unless asked separately.
