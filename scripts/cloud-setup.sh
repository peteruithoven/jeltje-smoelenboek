#!/bin/bash
# Installeert de dependencies in Claude Code cloudsessies (claude.ai/code, de Claude-app).
# Draait als SessionStart-hook, zie .claude/settings.json. Doet lokaal niets.

[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 1

# Gebruik de pnpm-versie uit devEngines; oudere voorgeïnstalleerde versies negeren die. npx draait
# buiten de projectmap, want daarbinnen weigert npm vanwege devEngines. De postinstall draait
# `nuxt prepare`. Hooks hebben geen TTY; CI=true voorkomt dat pnpm vragen stelt.
pnpm_version=$(node -p 'require("./package.json").devEngines.packageManager.version') || exit 1
(cd "$HOME" && CI=true npx --yes "pnpm@$pnpm_version" --dir "$CLAUDE_PROJECT_DIR" install \
  --frozen-lockfile --config.strict-dep-builds=false --config.pm-on-fail=ignore) || exit 1

# Er is geen globale Vite+ CLI; gebruik de `vp` van het project zelf.
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "export PATH=\"$CLAUDE_PROJECT_DIR/node_modules/.bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
