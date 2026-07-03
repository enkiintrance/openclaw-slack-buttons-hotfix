// Locates the installed official @openclaw/slack plugin, synchronously (the OpenClaw
// plugin loader transpiles plugin modules and does not support top-level await; Node
// >=20.19 supports require() of ESM, which keeps this sync). The plugin installer does
// not provide node_modules for peer deps, so bare specifiers fail when this plugin is
// installed via `openclaw plugins install`; fall back to the state-dir npm-projects
// store where plugin-sync installs channel plugins.
import { createRequire } from "node:module";
import { readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const require_ = createRequire(import.meta.url);

function candidateDists() {
  const dists = [];
  const state = process.env.OPENCLAW_STATE_DIR || join(homedir(), ".openclaw");
  const projects = join(state, "npm", "projects");
  if (existsSync(projects)) {
    for (const d of readdirSync(projects).sort().reverse()) {
      const p = join(projects, d, "node_modules", "@openclaw", "slack", "dist");
      if (existsSync(p)) dists.push(p);
    }
  }
  return dists;
}

export function loadSlackDistSync(rel) {
  try {
    return require_(`@openclaw/slack/dist/${rel}`);
  } catch {}
  for (const dist of candidateDists()) {
    const p = join(dist, rel);
    if (existsSync(p)) {
      return require_(p);
    }
  }
  throw new Error(
    `slack-buttons-hotfix: cannot locate @openclaw/slack dist/${rel}. ` +
    "Install/enable the official Slack plugin first.",
  );
}
