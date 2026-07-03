# openclaw-slack-buttons-hotfix

**Makes OpenClaw presentation buttons render as real Slack Block Kit buttons instead of a
bullet-text list.**

Hotfix for [openclaw/openclaw#95440](https://github.com/openclaw/openclaw/issues/95440)
(candidate upstream fix: [PR #95463](https://github.com/openclaw/openclaw/pull/95463)).

## The bug

The official Slack plugin contains a complete Block Kit presentation renderer, but the
outbound adapter it *registers with core* (`slackChannelOutbound`) omits
`renderPresentation` and `presentationCapabilities`. Core delivery therefore assumes the
channel cannot render buttons and downgrades every presentation — including
`{"blocks":[{"type":"buttons",...}]}` — to plain text like:

```
• ✅ Approve
• ⏭️ Skip
```

Affected: every `openclaw message send --presentation` and agent presentation send to
Slack, on 2026.6.x (verified still present in `@openclaw/slack@2026.7.1-beta.1`).
Telegram is unaffected (it renders presentation buttons inside its own send path).

## What this plugin does

It re-registers the **official, unmodified** Slack channel plugin under the same channel
id `slack`, with exactly two properties bridged onto the registered outbound adapter:

- `presentationCapabilities` — so core knows Slack can render buttons/selects, and
- `renderPresentation` — the same Block-Kit build the plugin's inner adapter already
  implements (via the plugin's own public `buildSlackPresentationBlocks`).

Everything else — auth, socket mode, inbound, interactive replies, threading, media —
is the official plugin, untouched. Channel takeover uses the sanctioned
`channelConfigs.slack.preferOver` mechanism, not monkey-patching.

**Self-retiring:** if the installed `@openclaw/slack` already exposes
`renderPresentation` (i.e. upstream shipped the fix), this plugin passes the official
plugin through completely unchanged. Once the fix is released you can simply uninstall.

## Install

```bash
openclaw plugins install clawhub:openclaw-slack-buttons-hotfix   # or npm:openclaw-slack-buttons-hotfix
openclaw plugins enable slack-buttons-hotfix
openclaw plugins disable slack     # the wrapper serves the "slack" channel instead
openclaw gateway restart
```

**Why disable the stock plugin:** with both enabled, core keeps routing the channel to the
stock plugin — `preferOver` in this plugin's manifest only prevents core from
auto-re-enabling the stock plugin later (e.g. because `channels.slack` is configured).
The official `@openclaw/slack` package itself must stay **installed** (this plugin loads
its code); only the plugin entry is disabled.

Your existing `channels.slack` config (tokens, allowlists, capabilities) is used as-is —
this plugin serves the same channel id. If your config uses a `plugins.allow` allowlist,
add `"slack-buttons-hotfix"` (the installer usually does this for you).

## Verify

```bash
openclaw message send --channel slack --target <your-dm> --json \
  --message "button test" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Tap me","value":"ok","style":"success"}]}]}'
```

You should see a real tappable button, and the JSON receipt should report
`parts[0].kind: "card"` (broken installs report `"text"`). Taps arrive back as inbound
text equal to the button `value` (same behavior as Telegram inline buttons).

## Uninstall (after upstream fixes #95440)

```bash
openclaw plugins enable slack
openclaw plugins disable slack-buttons-hotfix
openclaw plugins uninstall slack-buttons-hotfix
openclaw gateway restart
```

## License

MIT
