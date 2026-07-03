// Entry: registers the wrapped official Slack plugin under channel id "slack".
// openclaw.plugin.json declares channelConfigs.slack.preferOver:["slack"] so this plugin
// outranks the stock/bundled slack plugin when both are enabled (the sanctioned override
// mechanism — no monkey-patching, no fork).
import { defineBundledChannelEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "slack",
  name: "Slack (presentation-buttons hotfix)",
  description:
    "Official Slack channel + bridge for openclaw/openclaw#95440 (presentation buttons render as Block Kit instead of bullet text).",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./patched-plugin.js",
    exportName: "slackPluginPatched",
  },
  secrets: {
    specifier: "./secrets.js",
    exportName: "channelSecrets",
  },
  runtime: {
    specifier: "./runtime.js",
    exportName: "setSlackRuntime",
  },
});
